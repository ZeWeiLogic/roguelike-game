import { InputManager } from './InputManager.js'
import { Player } from './Player.js'
import { Enemy, Bullet } from './Enemy.js'
import { Item, DropGenerator } from './Item.js'
import { StageManager } from './StageManager.js'
import { ShopSystem } from './ShopSystem.js'

// 游戏状态
const GAME_STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  SHOP: 'shop',
  GAME_OVER: 'gameover',
  PAUSED: 'paused'
}

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')

    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.input = new InputManager(this.canvas)
    this.stageManager = new StageManager(this.canvas.width, this.canvas.height)
    this.shopSystem = new ShopSystem()
    this.dropGenerator = new DropGenerator()

    this.state = GAME_STATE.MENU
    this.lastTime = 0
    this.gameTime = 0

    this.setupMenuInput()
    this.gameLoop = this.gameLoop.bind(this)
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    if (this.stageManager) {
      this.stageManager.width = this.canvas.width
      this.stageManager.height = this.canvas.height
    }
  }

  setupMenuInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.GAME_OVER) {
          this.startGame()
        }
      }
      if (e.code === 'Escape') {
        if (this.state === GAME_STATE.SHOP) {
          this.state = GAME_STATE.PLAYING
        }
      }
    })

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (this.state === GAME_STATE.SHOP) {
        this.shopSystem.handleClick(x, y, this.player)
      } else if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.GAME_OVER) {
        this.startGame()
      }
    })
  }

  startGame() {
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2)
    this.enemies = []
    this.bullets = []
    this.items = []
    this.stageManager.reset(this.canvas.width, this.canvas.height)
    this.shopSystem.reset()
    this.spawnEnemies()
    this.state = GAME_STATE.PLAYING
    this.gameTime = 0
    this.lastTime = performance.now()
    requestAnimationFrame(this.gameLoop)
  }

  spawnEnemies() {
    const enemyData = this.stageManager.spawnEnemies()
    enemyData.forEach(data => {
      this.enemies.push(new Enemy(data.x, data.y, data.level))
    })
  }

  gameLoop(currentTime) {
    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.SHOP) {
      return
    }

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    this.gameTime += deltaTime

    this.update(deltaTime, currentTime)
    this.draw()

    requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime, currentTime) {
    if (this.state !== GAME_STATE.PLAYING) return

    // 更新玩家
    this.player.update(this.input, deltaTime, this.canvas.width, this.canvas.height)

    // 玩家攻击
    if (this.input.isKeyPressed('Space') || this.player.canAttack(currentTime)) {
      if (this.enemies.length > 0) {
        // 找到最近的敌人
        let nearestEnemy = null
        let nearestDist = Infinity

        this.enemies.forEach(enemy => {
          const dx = enemy.x - this.player.x
          const dy = enemy.y - this.player.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < nearestDist) {
            nearestDist = dist
            nearestEnemy = enemy
          }
        })

        if (nearestEnemy && this.player.canAttack(currentTime)) {
          this.bullets.push(new Bullet(
            this.player.x,
            this.player.y,
            nearestEnemy.x,
            nearestEnemy.y,
            this.player.attack
          ))
          this.player.attackNow(currentTime)
        }
      }
    }

    // 更新子弹
    this.bullets.forEach(bullet => bullet.update())
    this.bullets = this.bullets.filter(bullet => !bullet.isOutOfBounds(this.canvas.width, this.canvas.height))

    // 更新敌人
    this.enemies.forEach(enemy => {
      enemy.update(this.player.x, this.player.y, deltaTime)

      // 敌人攻击玩家
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < enemy.size + this.player.size && enemy.attackCooldown <= 0) {
        const dead = this.player.takeDamage(enemy.dealDamage())
        enemy.attackCooldown = enemy.attackRate

        if (dead) {
          this.state = GAME_STATE.GAME_OVER
        }
      }
    })

    // 子弹命中敌人
    this.bullets.forEach(bullet => {
      this.enemies.forEach(enemy => {
        const dx = bullet.x - enemy.x
        const dy = bullet.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < bullet.size + enemy.size) {
          bullet.size = 0 // 标记为删除
          if (enemy.takeDamage(bullet.damage)) {
            // 敌人死亡
            const drop = this.dropGenerator.createDrop(enemy.x, enemy.y)
            this.items.push(drop)
            this.enemies = this.enemies.filter(e => e !== enemy)
            this.stageManager.enemyKilled()

            // 检查是否过关
            if (this.stageManager.doorOpen && this.stageManager.roomType === 'normal') {
              // 自动进入下一房间
              setTimeout(() => {
                if (this.state === GAME_STATE.PLAYING) {
                  this.stageManager.nextRoom()
                  this.spawnEnemies()
                }
              }, 500)
            }
          }
        }
      })
    })
    this.bullets = this.bullets.filter(bullet => bullet.size > 0)

    // 更新道具
    this.items.forEach(item => {
      item.update(this.gameTime)
      if (!item.collected && item.collidesWith(this.player)) {
        const collected = item.collect()
        if (collected.type === 'coin') {
          this.player.addCoin(collected.value)
        } else if (collected.type === 'health') {
          this.player.heal(collected.value)
        }
        this.items = this.items.filter(i => !i.collected)
      }
    })

    // 检查商店
    if (this.stageManager.roomType === 'shop' && this.stageManager.doorOpen) {
      this.state = GAME_STATE.SHOP
    }

    // 触摸进入商店
    if (this.stageManager.roomType === 'shop' && this.input.isKeyPressed('KeyE')) {
      this.state = GAME_STATE.SHOP
    }
  }

  draw() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.state === GAME_STATE.MENU) {
      this.drawMenu()
      return
    }

    if (this.state === GAME_STATE.GAME_OVER) {
      this.drawGameOver()
      return
    }

    // 绘制房间
    this.stageManager.draw(this.ctx, this.canvas.width, this.canvas.height)

    // 绘制道具
    this.items.forEach(item => item.draw(this.ctx))

    // 绘制玩家
    this.player.draw(this.ctx)

    // 绘制敌人
    this.enemies.forEach(enemy => enemy.draw(this.ctx))

    // 绘制子弹
    this.bullets.forEach(bullet => bullet.draw(this.ctx))

    // 绘制 UI
    this.drawUI()

    // 商店界面
    if (this.state === GAME_STATE.SHOP) {
      this.shopSystem.draw(this.ctx, this.canvas.width, this.canvas.height, this.player)
    }

    // 虚拟摇杆（触摸时显示）
    if (this.input.touch.active) {
      const centerX = this.canvas.width / 2
      const centerY = this.canvas.height * 0.75
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
      this.ctx.stroke()

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      this.ctx.beginPath()
      this.ctx.arc(this.input.touch.x, this.input.touch.y, 30, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  drawUI() {
    // 生命条
    const barX = 20
    const barY = 50
    const barWidth = 150
    const barHeight = 12
    const healthPercent = this.player.health / this.player.maxHealth

    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)
    this.ctx.fillStyle = '#e94560'
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    this.ctx.fillStyle = '#fff'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`${Math.floor(this.player.health)} / ${this.player.maxHealth}`, barX + 5, barY + 10)

    // 金币
    this.ctx.fillStyle = '#ffd700'
    this.ctx.font = '16px Arial'
    this.ctx.fillText(`💰 ${this.player.coin}`, barX, barY + 30)

    // 等级
    this.ctx.fillStyle = '#4a9'
    this.ctx.fillText(`等级 ${this.player.level}`, barX, barY + 50)

    // 武器
    this.ctx.fillStyle = '#aaa'
    this.ctx.fillText(`武器: ${this.player.weapons.join(', ')}`, barX, barY + 70)

    // 攻击力和速度
    this.ctx.fillText(`攻击: ${this.player.attack} | 速度: ${this.player.attackSpeed}ms`, barX, barY + 90)

    // 攻击冷却指示
    const now = performance.now()
    const cooldownPercent = Math.min(1, (now - this.player.lastAttack) / this.player.attackSpeed)
    this.ctx.fillStyle = '#666'
    this.ctx.fillRect(this.canvas.width - 120, 20, 100, 8)
    this.ctx.fillStyle = cooldownPercent >= 1 ? '#4a9' : '#e94560'
    this.ctx.fillRect(this.canvas.width - 120, 20, 100 * cooldownPercent, 8)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '10px Arial'
    this.ctx.fillText('攻击冷却', this.canvas.width - 120, 38)

    // 下一房间提示
    if (this.stageManager.doorOpen) {
      this.ctx.fillStyle = '#4a9'
      this.ctx.font = 'bold 18px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('门已开启!', this.canvas.width / 2, this.canvas.height - 50)
    }

    // 商店提示
    if (this.stageManager.roomType === 'shop' && !this.stageManager.doorOpen) {
      this.ctx.fillStyle = '#ffd700'
      this.ctx.font = 'bold 18px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('按 E 进入商店', this.canvas.width / 2, this.canvas.height - 50)
    }
  }

  drawMenu() {
    // 背景
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 标题
    this.ctx.fillStyle = '#e94560'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('肉鸽幸存者', this.canvas.width / 2, this.canvas.height / 2 - 80)

    // 副标题
    this.ctx.fillStyle = '#888'
    this.ctx.font = '18px Arial'
    this.ctx.fillText('一款 PWA 动作肉鸽游戏', this.canvas.width / 2, this.canvas.height / 2 - 40)

    // 开始提示
    this.ctx.fillStyle = '#4a9'
    this.ctx.font = '24px Arial'
    const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7
    this.ctx.globalAlpha = pulse
    this.ctx.fillText('点击或按空格开始', this.canvas.width / 2, this.canvas.height / 2 + 40)
    this.ctx.globalAlpha = 1

    // 操作说明
    this.ctx.fillStyle = '#666'
    this.ctx.font = '14px Arial'
    this.ctx.fillText('WASD / 方向键 移动 | 空格 攻击 | E 商店 | ESC 关闭', this.canvas.width / 2, this.canvas.height - 60)
  }

  drawGameOver() {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 游戏结束文字
    this.ctx.fillStyle = '#e94560'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 60)

    // 统计
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '20px Arial'
    this.ctx.fillText(`到达房间: ${this.stageManager.room}`, this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.fillText(`等级: ${this.player.level}`, this.canvas.width / 2, this.canvas.height / 2 + 35)
    this.ctx.fillText(`金币: ${this.player.coin}`, this.canvas.width / 2, this.canvas.height / 2 + 70)

    // 重新开始提示
    this.ctx.fillStyle = '#4a9'
    this.ctx.font = '24px Arial'
    const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7
    this.ctx.globalAlpha = pulse
    this.ctx.fillText('点击或按空格重新开始', this.canvas.width / 2, this.canvas.height / 2 + 130)
    this.ctx.globalAlpha = 1
  }
}