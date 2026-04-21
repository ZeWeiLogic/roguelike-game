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

    // 屏幕震动
    this.shakeIntensity = 0
    this.shakeDuration = 0

    // 冻结帧
    this.freezeTime = 0

    this.setupMenuInput()
    this.gameLoop = this.gameLoop.bind(this)
  }

  triggerScreenShake(intensity = 5, duration = 100) {
    this.shakeIntensity = intensity
    this.shakeDuration = duration
  }

  triggerFreezeFrame(duration = 10) {
    this.freezeTime = duration
  }

  start() {
    this.draw()
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

    // 冻结帧处理
    if (this.freezeTime > 0) {
      this.freezeTime -= 1
      requestAnimationFrame(this.gameLoop)
      return
    }

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    this.gameTime += deltaTime

    // 更新震动
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime
    }

    this.update(deltaTime, currentTime)

    // 应用屏幕震动偏移
    this.ctx.save()
    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2
      this.ctx.translate(offsetX, offsetY)
    }

    this.draw()
    this.ctx.restore()

    requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime, currentTime) {
    if (this.state !== GAME_STATE.PLAYING) return

    // 更新玩家
    this.player.update(this.input, deltaTime, this.canvas.width, this.canvas.height)

    // 玩家攻击
    const now = performance.now()
    if (this.input.isKeyPressed('Space') && this.player.canAttack(now)) {
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

        if (nearestEnemy) {
          this.bullets.push(new Bullet(
            this.player.x,
            this.player.y,
            nearestEnemy.x,
            nearestEnemy.y,
            this.player.attack
          ))
          this.player.attackNow(now)
        }
      }
    }

    // 更新子弹
    this.bullets.forEach(bullet => bullet.update())
    this.bullets = this.bullets.filter(bullet => !bullet.isOutOfBounds(this.canvas.width, this.canvas.height))

    // 更新敌人
    this.enemies.forEach(enemy => {
      enemy.update(this.player.x, this.player.y, deltaTime)
      enemy.updateFloatingTexts(deltaTime)

      // 敌人攻击玩家
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < enemy.size + this.player.size && enemy.attackCooldown <= 0) {
        const dead = this.player.takeDamage(enemy.dealDamage())
        enemy.attackCooldown = enemy.attackRate

        // 玩家受伤触发屏幕震动
        this.triggerScreenShake(6, 120)

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

          // 暴击判定
          const isCrit = Math.random() < this.player.critChance
          const damage = isCrit ? bullet.damage * 2 : bullet.damage

          // 触发闪烁和浮动文字
          enemy.triggerFlash()
          enemy.addFloatingText(damage.toString(), isCrit)

          // 触发屏幕震动
          this.triggerScreenShake(isCrit ? 8 : 3, isCrit ? 150 : 100)

          // 暴击触发冻结帧
          if (isCrit) {
            this.triggerFreezeFrame(15)
          }

          // 更新敌人浮动文字
          enemy.updateFloatingTexts(deltaTime)

          if (enemy.takeDamage(damage)) {
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

    // 绘制地砖地板
    this.drawFloor()

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

    // 绘制环境光效（玩家周围的迷雾）
    this.drawFogEffect()

    // 绘制墙壁阴影
    this.drawWallShadow()

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

  // 绘制地砖地板
  drawFloor() {
    const tileSize = 40
    const cols = Math.ceil(this.canvas.width / tileSize) + 1
    const rows = Math.ceil(this.canvas.height / tileSize) + 1

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * tileSize
        const py = y * tileSize

        // 基础地砖颜色
        this.ctx.fillStyle = '#2a2a3a'
        this.ctx.fillRect(px, py, tileSize, tileSize)

        // 地砖边缘深色勾边
        this.ctx.strokeStyle = '#1a1a2a'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(px, py, tileSize, tileSize)

        // 随机裂纹和杂色
        const seed = x * 1000 + y
        const rng = () => {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff
          return seed / 0x7fffffff
        }

        // 添加一些杂色像素
        if (rng() > 0.7) {
          this.ctx.fillStyle = '#222233'
          this.ctx.fillRect(px + rng() * tileSize * 0.8, py + rng() * tileSize * 0.8, 2, 2)
        }
        if (rng() > 0.85) {
          this.ctx.fillStyle = '#333344'
          this.ctx.fillRect(px + rng() * tileSize * 0.6, py + rng() * tileSize * 0.6, 3, 3)
        }
      }
    }
  }

  // 绘制圆形迷雾效果
  drawFogEffect() {
    const gradient = this.ctx.createRadialGradient(
      this.player.x, this.player.y, 150,
      this.player.x, this.player.y, 300
    )
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0)')
    gradient.addColorStop(0.5, 'rgba(26, 26, 46, 0.3)')
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.8)')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 绘制墙壁阴影
  drawWallShadow() {
    const shadowSize = 40
    const gradient = this.ctx.createLinearGradient(0, 0, shadowSize, 0)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    // 左边墙壁阴影
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, shadowSize, this.canvas.height)

    // 上边墙壁阴影
    const gradientTop = this.ctx.createLinearGradient(0, 0, 0, shadowSize)
    gradientTop.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
    gradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)')
    this.ctx.fillStyle = gradientTop
    this.ctx.fillRect(0, 0, this.canvas.width, shadowSize)

    // 右边墙壁阴影
    const gradientRight = this.ctx.createLinearGradient(this.canvas.width - shadowSize, 0, this.canvas.width, 0)
    gradientRight.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradientRight.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    this.ctx.fillStyle = gradientRight
    this.ctx.fillRect(this.canvas.width - shadowSize, 0, shadowSize, this.canvas.height)

    // 下边墙壁阴影
    const gradientBottom = this.ctx.createLinearGradient(0, this.canvas.height - shadowSize, 0, this.canvas.height)
    gradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradientBottom.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    this.ctx.fillStyle = gradientBottom
    this.ctx.fillRect(0, this.canvas.height - shadowSize, this.canvas.width, shadowSize)
  }

  drawUI() {
    const panelX = 10
    const panelY = 40
    const panelWidth = 180
    const panelHeight = 140

    // 面板背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.roundRect(this.ctx, panelX, panelY, panelWidth, panelHeight, 8)
    this.ctx.fill()

    // 面板边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 1
    this.roundRect(this.ctx, panelX, panelY, panelWidth, panelHeight, 8)
    this.ctx.stroke()

    // 生命条底槽
    const barX = panelX + 15
    const barY = panelY + 20
    const barWidth = 150
    const barHeight = 16
    const healthPercent = this.player.health / this.player.maxHealth

    // 底槽
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)

    // 白色缓冲层（受伤时延迟减少）
    const bufferPercent = 0.8 // 简化版
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.fillRect(barX, barY, barWidth * bufferPercent, barHeight)

    // 实际血量
    this.ctx.fillStyle = '#e94560'
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    // 血条边框
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(barX, barY, barWidth, barHeight)

    // 生命值文字
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 2
    this.ctx.fillText(`${Math.floor(this.player.health)} / ${this.player.maxHealth}`, barX + barWidth / 2, barY + 12)
    this.ctx.shadowBlur = 0

    // 等级图标和文字
    const statY = barY + 35
    this.drawPixelIcon(this.ctx, barX, statY, 'level')
    this.ctx.fillStyle = '#4a9'
    this.ctx.font = '14px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`LV ${this.player.level}`, barX + 18, statY + 10)

    // 金币图标和文字
    this.drawPixelIcon(this.ctx, barX + 70, statY, 'coin')
    this.ctx.fillStyle = '#ffd700'
    this.ctx.fillText(`${this.player.coin}`, barX + 88, statY + 10)

    // 攻击力图标和文字
    const statY2 = statY + 30
    this.drawPixelIcon(this.ctx, barX, statY2, 'attack')
    this.ctx.fillStyle = '#e94560'
    this.ctx.fillText(`ATK ${this.player.attack}`, barX + 18, statY2 + 10)

    // 攻击速度图标和文字
    this.drawPixelIcon(this.ctx, barX + 90, statY2, 'speed')
    this.ctx.fillStyle = '#aaa'
    this.ctx.font = '12px monospace'
    this.ctx.fillText(`${1000 - this.player.attackSpeed + 200}ms`, barX + 108, statY2 + 10)

    // 攻击冷却指示
    const now = performance.now()
    const cooldownPercent = Math.min(1, (now - this.player.lastAttack) / this.player.attackSpeed)
    const cdX = this.canvas.width - 130
    const cdY = 20

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.roundRect(this.ctx, cdX, cdY, 120, 35, 6)
    this.ctx.fill()

    this.ctx.fillStyle = '#666'
    this.ctx.fillRect(cdX + 10, cdY + 12, 100, 8)
    this.ctx.fillStyle = cooldownPercent >= 1 ? '#4a9' : '#e94560'
    this.ctx.fillRect(cdX + 10, cdY + 12, 100 * cooldownPercent, 8)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '10px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('ATTACK', cdX + 60, cdY + 28)

    // 房间信息
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.roundRect(this.ctx, this.canvas.width / 2 - 60, 10, 120, 30, 6)
    this.ctx.fill()

    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 14px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`房间 ${this.stageManager.room}`, this.canvas.width / 2, 30)
  }

  // 绘制像素图标
  drawPixelIcon(ctx, x, y, type) {
    const size = 8
    ctx.save()

    switch (type) {
      case 'level':
        // 星星图标
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y)
        ctx.lineTo(x + size * 0.7, y + size * 0.3)
        ctx.lineTo(x + size, y + size * 0.5)
        ctx.lineTo(x + size * 0.7, y + size * 0.7)
        ctx.lineTo(x + size * 0.5, y + size)
        ctx.lineTo(x + size * 0.3, y + size * 0.7)
        ctx.lineTo(x, y + size * 0.5)
        ctx.lineTo(x + size * 0.3, y + size * 0.3)
        ctx.closePath()
        ctx.fill()
        break
      case 'coin':
        // 金币图标
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#b8860b'
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'attack':
        // 剑图标
        ctx.fillStyle = '#e94560'
        ctx.fillRect(x + size / 4, y, size / 3, size * 0.7)
        ctx.fillStyle = '#aaa'
        ctx.fillRect(x + size / 4 - 1, y + size * 0.65, size / 2 + 2, size / 5)
        break
      case 'speed':
        // 时钟图标
        ctx.strokeStyle = '#aaa'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, size / 2 - 1, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y + size / 2)
        ctx.lineTo(x + size / 2, y + size / 4)
        ctx.moveTo(x + size / 2, y + size / 2)
        ctx.lineTo(x + size * 0.7, y + size / 2)
        break
    }

    ctx.restore()
  }

  // 圆角矩形辅助函数
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  drawMenu() {
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