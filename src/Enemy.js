import { ProceduralGenerator } from './ProceduralGenerator.js'

// 敌人类型
const ENEMY_TYPES = ['slime', 'skeleton', 'demon']

// 敌人类
export class Enemy {
  constructor(x, y, level = 1) {
    this.x = x
    this.y = y
    this.level = level
    this.size = 18 + level * 2
    this.maxHealth = 30 + level * 15
    this.health = this.maxHealth
    this.speed = 1 + level * 0.2
    this.attack = 5 + level * 2
    this.type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]
    this.generator = new ProceduralGenerator(Date.now() + Math.random() * 10000)
    this.attackCooldown = 0
    this.attackRate = 1000 // 1秒攻击一次

    // 闪烁效果
    this.flashTimer = 0
    this.isFlashing = false

    // 浮动数字
    this.floatingTexts = []
  }

  triggerFlash() {
    this.isFlashing = true
    this.flashTimer = 80
  }

  addFloatingText(text, isCrit = false) {
    this.floatingTexts.push({
      text,
      y: -this.size,
      vy: -1,
      life: 1,
      isCrit
    })
  }

  updateFloatingTexts(deltaTime) {
    this.floatingTexts.forEach(ft => {
      ft.y += ft.vy
      ft.life -= 0.03
    })
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0)

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime
      if (this.flashTimer <= 0) {
        this.isFlashing = false
      }
    }
  }

  update(playerX, playerY, deltaTime) {
    // 向玩家移动
    const dx = playerX - this.x
    const dy = playerY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      this.x += (dx / distance) * this.speed
      this.y += (dy / distance) * this.speed
    }

    // 更新攻击冷却
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }
  }

  draw(ctx) {
    ctx.save()

    // 闪烁效果
    if (this.isFlashing) {
      ctx.globalAlpha = 0.7
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    this.generator.generateEnemy(ctx, this.x, this.y, this.size, this.type)

    // 绘制浮动文字
    this.floatingTexts.forEach(ft => {
      ctx.font = 'bold 12px monospace'
      ctx.fillStyle = ft.isCrit ? `rgba(255, 50, 50, ${ft.life})` : `rgba(255, 255, 255, ${ft.life})`
      ctx.textAlign = 'center'
      ctx.fillText(ft.text, this.x, this.y + ft.y)
    })

    ctx.restore()

    // 血条
    const barWidth = this.size * 2
    const barHeight = 3
    const healthPercent = this.health / this.maxHealth

    ctx.fillStyle = '#333'
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth, barHeight)
    ctx.fillStyle = '#e94560'
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 10, barWidth * healthPercent, barHeight)
  }

  takeDamage(amount) {
    this.health -= amount
    return this.health <= 0
  }

  canAttack(now, lastAttack) {
    return now - lastAttack >= this.attackRate
  }

  dealDamage() {
    return this.attack
  }
}

// 子弹类
export class Bullet {
  constructor(x, y, targetX, targetY, damage, speed = 5) {
    this.x = x
    this.y = y
    this.size = 5
    this.speed = speed
    this.damage = damage

    const dx = targetX - x
    const dy = targetY - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.vx = dx / distance * speed
    this.vy = dy / distance * speed
  }

  update() {
    this.x += this.vx
    this.y += this.vy
  }

  draw(ctx) {
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }

  isOutOfBounds(width, height) {
    return this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50
  }
}