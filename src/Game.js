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

    // 触摸是否在UI区域
    this.touchInUI = { shopButton: false }

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
    const oldWidth = this.canvas.width
    const oldHeight = this.canvas.height

    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight

    if (this.stageManager) {
      this.stageManager.width = this.canvas.width
      this.stageManager.height = this.canvas.height
    }

    // 重新初始化摇杆位置
    if (this.input) {
      this.input.canvas = this.canvas
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
      if (e.code === 'KeyE' && this.state === GAME_STATE.PLAYING) {
        if (this.stageManager.roomType === 'shop') {
          this.state = GAME_STATE.SHOP
        }
      }
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && this.state === GAME_STATE.PLAYING) {
        if (this.stageManager.doorOpen) {
          this.stageManager.nextRoom()
          this.spawnEnemies()
        }
      }
    })

    this.canvas.addEventListener('click', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (this.state === GAME_STATE.SHOP) {
        const result = this.shopSystem.handleClick(x, y, this.player, this.canvas.width)
        if (result === 'close') {
          this.state = GAME_STATE.PLAYING
        }
      } else if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.GAME_OVER) {
        this.startGame()
      } else if (this.state === GAME_STATE.PLAYING) {
        // 检查商店按钮
        if (this.stageManager.roomType === 'shop' && this.shopButton) {
          const btn = this.shopButton
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.state = GAME_STATE.SHOP
            return
          }
        }
      }
    })

    // 移动端触摸
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      if (this.state === GAME_STATE.SHOP) {
        const result = this.shopSystem.handleClick(x, y, this.player, this.canvas.width)
        if (result === 'close') {
          this.state = GAME_STATE.PLAYING
        }
      } else if (this.state === GAME_STATE.MENU || this.state === GAME_STATE.GAME_OVER) {
        this.startGame()
      } else if (this.state === GAME_STATE.PLAYING) {
        // 检查商店按钮 - 只在右半边检测
        if (this.stageManager.roomType === 'shop' && this.shopButton && x > this.canvas.width / 2) {
          const btn = this.shopButton
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.state = GAME_STATE.SHOP
          }
        }
      }
    }, { passive: false })
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
      const shakeAmount = Math.min(this.shakeDuration / 50, 1) * this.shakeIntensity
      const offsetX = (Math.random() - 0.5) * shakeAmount * 2
      const offsetY = (Math.random() - 0.5) * shakeAmount * 2
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

    // 玩家攻击（自动射击）
    const now = performance.now()
    if (this.player.canAttack(now) && this.enemies.length > 0) {
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
        this.triggerScreenShake(2, 50)
      }
    }

    // 更新子弹
    this.bullets.forEach(bullet => bullet.update())
    this.bullets = this.bullets.filter(bullet => !bullet.isOutOfBounds(this.canvas.width, this.canvas.height))

    // 更新敌人
    this.enemies.forEach(enemy => {
      enemy.update(this.player.x, this.player.y, deltaTime)
      enemy.updateFloatingTexts(deltaTime)

      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < enemy.size + this.player.size && enemy.attackCooldown <= 0) {
        const dead = this.player.takeDamage(enemy.dealDamage())
        enemy.attackCooldown = enemy.attackRate
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
          bullet.size = 0

          const isCrit = Math.random() < this.player.critChance
          const damage = isCrit ? bullet.damage * 2 : bullet.damage

          enemy.triggerFlash()
          enemy.addFloatingText(damage.toString(), isCrit)
          this.triggerScreenShake(isCrit ? 8 : 3, isCrit ? 150 : 100)

          if (isCrit) {
            this.triggerFreezeFrame(15)
          }

          enemy.updateFloatingTexts(deltaTime)

          if (enemy.takeDamage(damage)) {
            const drop = this.dropGenerator.createDrop(enemy.x, enemy.y)
            this.items.push(drop)
            this.enemies = this.enemies.filter(e => e !== enemy)
            this.stageManager.enemyKilled()

            if (this.stageManager.doorOpen && this.stageManager.roomType === 'normal') {
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

    // 商店自动打开
    if (this.stageManager.roomType === 'shop' && this.stageManager.doorOpen && this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.SHOP
    }
  }

  draw() {
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

    // 绘制地砖地板（像素纹理风格）
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

    // 绘制战争迷雾
    this.drawFogEffect()

    // 绘制墙壁阴影
    this.drawWallShadow()

    // 绘制 UI（横屏布局：左侧状态，右侧按钮）
    this.drawUI()

    // 商店按钮（横屏右侧）
    if (this.state === GAME_STATE.PLAYING && this.stageManager.roomType === 'shop') {
      const btnX = this.canvas.width - 140
      const btnY = this.canvas.height - 90
      const btnW = 120
      const btnH = 70

      // 发光效果的商店按钮
      this.ctx.shadowColor = '#ffd700'
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.95)'
      this.roundRect(this.ctx, btnX, btnY, btnW, btnH, 15)
      this.ctx.fill()
      this.ctx.shadowBlur = 0

      this.ctx.fillStyle = '#1a1a2e'
      this.ctx.font = 'bold 22px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('商店', btnX + btnW / 2, btnY + btnH / 2 + 7)

      this.shopButton = { x: btnX, y: btnY, w: btnW, h: btnH }
    } else {
      this.shopButton = null
    }

    // 商店界面
    if (this.state === GAME_STATE.SHOP) {
      this.shopSystem.draw(this.ctx, this.canvas.width, this.canvas.height, this.player)
    }

    // 动态摇杆绘制
    this.drawJoystick()
  }

  // 绘制动态摇杆
  drawJoystick() {
    const data = this.input.getJoystickData()
    if (!data.active) return

    // 底座圆环（半透明白色）
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    this.ctx.lineWidth = 4
    this.ctx.beginPath()
    this.ctx.arc(data.baseX, data.baseY, 55, 0, Math.PI * 2)
    this.ctx.stroke()

    // 内部填充
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    this.ctx.beginPath()
    this.ctx.arc(data.baseX, data.baseY, 55, 0, Math.PI * 2)
    this.ctx.fill()

    // 中心小圆球（跟随手指）
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    this.ctx.shadowBlur = 10
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    this.ctx.beginPath()
    this.ctx.arc(data.stickX, data.stickY, 25, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.shadowBlur = 0
  }

  // 像素纹理地砖
  drawFloor() {
    const tileSize = 48 // 横屏用大一点的砖
    const cols = Math.ceil(this.canvas.width / tileSize) + 1
    const rows = Math.ceil(this.canvas.height / tileSize) + 1

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * tileSize
        const py = y * tileSize

        // 基础地砖 - 深浅交替
        const isLight = (x + y) % 2 === 0
        this.ctx.fillStyle = isLight ? '#2a2a3a' : '#252535'
        this.ctx.fillRect(px, py, tileSize, tileSize)

        // 地砖边缘深色勾边
        this.ctx.strokeStyle = '#1a1a28'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2)

        // 随机裂纹和杂色
        let seed = x * 1000 + y
        const rng = () => {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff
          return seed / 0x7fffffff
        }

        // 添加杂色像素（模拟像素纹理）
        if (rng() > 0.6) {
          this.ctx.fillStyle = '#222230'
          const cx = px + rng() * tileSize * 0.8 + 4
          const cy = py + rng() * tileSize * 0.8 + 4
          const size = 2 + rng() * 3
          this.ctx.fillRect(cx, cy, size, size)
        }
        if (rng() > 0.75) {
          this.ctx.fillStyle = '#333344'
          const cx = px + rng() * tileSize * 0.6 + 4
          const cy = py + rng() * tileSize * 0.6 + 4
          this.ctx.fillRect(cx, cy, 2, 2)
        }
        // 偶尔有裂缝线
        if (rng() > 0.92) {
          this.ctx.strokeStyle = '#1a1a25'
          this.ctx.lineWidth = 1
          this.ctx.beginPath()
          this.ctx.moveTo(px + rng() * tileSize, py + rng() * tileSize * 0.3)
          this.ctx.lineTo(px + rng() * tileSize, py + tileSize)
          this.ctx.stroke()
        }
      }
    }
  }

  // 战争迷雾效果
  drawFogEffect() {
    const centerX = this.player.x
    const centerY = this.player.y
    const innerRadius = 180
    const outerRadius = 350

    // 创建径向渐变迷雾
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    )
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0)')
    gradient.addColorStop(0.4, 'rgba(26, 26, 46, 0.2)')
    gradient.addColorStop(0.7, 'rgba(26, 26, 46, 0.5)')
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.85)')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 墙壁阴影
  drawWallShadow() {
    const shadowSize = 50

    // 左边
    let gradient = this.ctx.createLinearGradient(0, 0, shadowSize, 0)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, shadowSize, this.canvas.height)

    // 上边
    gradient = this.ctx.createLinearGradient(0, 0, 0, shadowSize)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, shadowSize)

    // 右边
    gradient = this.ctx.createLinearGradient(this.canvas.width - shadowSize, 0, this.canvas.width, 0)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(this.canvas.width - shadowSize, 0, shadowSize, this.canvas.height)

    // 下边
    gradient = this.ctx.createLinearGradient(0, this.canvas.height - shadowSize, 0, this.canvas.height)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, this.canvas.height - shadowSize, this.canvas.width, shadowSize)
  }

  // 横屏 UI 布局：左侧状态面板，右侧攻击指示
  drawUI() {
    // === 左侧：状态面板（悬浮风格）===
    const panelX = 15
    const panelY = 15
    const panelW = 200
    const panelH = this.canvas.height - 30

    // 面板背景（半透明黑色圆角+发光边框）
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'
    this.ctx.shadowBlur = 8
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.roundRect(this.ctx, panelX, panelY, panelW, panelH, 12)
    this.ctx.fill()
    this.ctx.shadowBlur = 0

    // 发光边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    this.ctx.lineWidth = 2
    this.roundRect(this.ctx, panelX, panelY, panelW, panelH, 12)
    this.ctx.stroke()

    // 生命条
    const barX = panelX + 15
    const barY = panelY + 25
    const barW = panelW - 30
    const barH = 20
    const healthPercent = this.player.health / this.player.maxHealth

    // 血条背景
    this.ctx.fillStyle = '#1a1a2e'
    this.roundRect(this.ctx, barX, barY, barW, barH, 5)
    this.ctx.fill()

    // 血条（渐变）
    if (healthPercent > 0) {
      const healthGradient = this.ctx.createLinearGradient(barX, 0, barX + barW * healthPercent, 0)
      healthGradient.addColorStop(0, '#e94560')
      healthGradient.addColorStop(1, '#ff6b6b')
      this.ctx.fillStyle = healthGradient
      this.roundRect(this.ctx, barX, barY, barW * healthPercent, barH, 5)
      this.ctx.fill()
    }

    // 血条边框
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 2
    this.roundRect(this.ctx, barX, barY, barW, barH, 5)
    this.ctx.stroke()

    // 血量文字（黑底白字）
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 3
    this.ctx.fillText(`${Math.floor(this.player.health)} / ${this.player.maxHealth}`, barX + barW / 2, barY + 14)
    this.ctx.shadowBlur = 0

    // 数值统计区
    const statStartY = barY + 45
    const statGap = 50

    // LV
    this.ctx.fillStyle = '#ffd700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 3
    this.ctx.fillText(`LV ${this.player.level}`, barX + 10, statStartY + 10)
    this.ctx.shadowBlur = 0

    // 金币
    this.ctx.fillStyle = '#ffd700'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.fillText(`💰 ${this.player.coin}`, barX + 10, statStartY + statGap)
    this.ctx.shadowBlur = 0

    // 攻击力
    this.ctx.fillStyle = '#e94560'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText(`ATK ${this.player.attack}`, barX + 10, statStartY + statGap * 2)

    // 攻击速度
    this.ctx.fillStyle = '#aaa'
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`SPD ${1000 - this.player.attackSpeed + 200}ms`, barX + 10, statStartY + statGap * 3)

    // 暴击率
    this.ctx.fillStyle = '#9b59b6'
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`暴击 ${Math.round(this.player.critChance * 100)}%`, barX + 10, statStartY + statGap * 4)

    // === 右侧：攻击冷却指示 ===
    const cdX = this.canvas.width - 130
    const cdY = this.canvas.height - 80
    const cdW = 100
    const cdH = 60

    // 攻击冷却背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.roundRect(this.ctx, cdX, cdY, cdW, cdH, 10)
    this.ctx.fill()

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.lineWidth = 2
    this.roundRect(this.ctx, cdX, cdY, cdW, cdH, 10)
    this.ctx.stroke()

    // ATTACK 文字
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 2
    this.ctx.fillText('ATTACK', cdX + cdW / 2, cdY + 20)

    // 冷却条
    const now = performance.now()
    const cooldownPercent = Math.min(1, (now - this.player.lastAttack) / this.player.attackSpeed)
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(cdX + 10, cdY + 30, cdW - 20, 8)
    this.ctx.fillStyle = cooldownPercent >= 1 ? '#4a9' : '#e94560'
    this.ctx.fillRect(cdX + 10, cdY + 30, (cdW - 20) * cooldownPercent, 8)
    this.ctx.shadowBlur = 0

    // === 房间信息（顶部中间） ===
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.roundRect(this.ctx, this.canvas.width / 2 - 50, 10, 100, 35, 8)
    this.ctx.fill()

    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`房间 ${this.stageManager.room}`, this.canvas.width / 2, 33)

    // 门开启提示（底部中间）
    if (this.stageManager.doorOpen && this.state === GAME_STATE.PLAYING) {
      this.ctx.fillStyle = '#4a9'
      this.ctx.font = 'bold 18px Arial'
      this.ctx.textAlign = 'center'
      const pulse = Math.sin(performance.now() / 300) * 0.3 + 0.7
      this.ctx.globalAlpha = pulse
      this.ctx.fillText('门已开启', this.canvas.width / 2, this.canvas.height - 20)
      this.ctx.globalAlpha = 1
    }
  }

  // 圆角矩形
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
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 背景装饰线
    for (let i = 0; i < 5; i++) {
      this.ctx.strokeStyle = 'rgba(233, 69, 96, 0.1)'
      this.ctx.lineWidth = 1
      const y = this.canvas.height * (i + 1) / 6
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }

    // 标题
    this.ctx.fillStyle = '#e94560'
    this.ctx.font = 'bold 56px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 10
    this.ctx.fillText('肉鸽幸存者', this.canvas.width / 2, this.canvas.height / 2 - 60)
    this.ctx.shadowBlur = 0

    // 副标题
    this.ctx.fillStyle = '#888'
    this.ctx.font = '20px Arial'
    this.ctx.fillText('横屏版 · 手机优化', this.canvas.width / 2, this.canvas.height / 2 - 15)

    // 开始提示
    this.ctx.fillStyle = '#4a9'
    this.ctx.font = 'bold 28px Arial'
    const pulse = Math.sin(performance.now() / 400) * 0.3 + 0.7
    this.ctx.globalAlpha = pulse
    this.ctx.fillText('点击或按空格开始', this.canvas.width / 2, this.canvas.height / 2 + 60)
    this.ctx.globalAlpha = 1

    // 操作说明
    this.ctx.fillStyle = '#555'
    this.ctx.font = '16px Arial'
    this.ctx.fillText('WASD 移动 | 手指左屏控制方向 | E 进入商店 | ESC 关闭', this.canvas.width / 2, this.canvas.height - 50)
  }

  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 游戏结束文字
    this.ctx.fillStyle = '#e94560'
    this.ctx.font = 'bold 52px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#000'
    this.ctx.shadowBlur = 10
    this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 70)
    this.ctx.shadowBlur = 0

    // 统计
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '24px Arial'
    this.ctx.fillText(`到达房间: ${this.stageManager.room}`, this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.fillText(`等级: ${this.player.level}`, this.canvas.width / 2, this.canvas.height / 2 + 40)
    this.ctx.fillText(`金币: ${this.player.coin}`, this.canvas.width / 2, this.canvas.height / 2 + 80)

    // 重新开始
    this.ctx.fillStyle = '#4a9'
    this.ctx.font = 'bold 26px Arial'
    const pulse = Math.sin(performance.now() / 400) * 0.3 + 0.7
    this.ctx.globalAlpha = pulse
    this.ctx.fillText('点击或按空格重新开始', this.canvas.width / 2, this.canvas.height / 2 + 150)
    this.ctx.globalAlpha = 1
  }
}