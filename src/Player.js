import { ProceduralGenerator } from './ProceduralGenerator.js'

// 玩家类 - 像素小骑士
export class Player {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = 20
    this.maxHealth = 100
    this.health = 100
    this.speed = 3
    this.attack = 10
    this.attackSpeed = 500 // 毫秒
    this.lastAttack = 0
    this.critChance = 0.1
    this.weapons = ['sword']
    this.coin = 0
    this.level = 1
    this.exp = 0
    this.generator = new ProceduralGenerator(Date.now())
    this.color = '#3a5fcd' // 深蓝色盔甲

    // 动画状态
    this.breatheOffset = 0
    this.breatheTime = 0
    this.tiltAngle = 0
    this.targetTiltAngle = 0
    this.lastX = x
    this.lastY = y
    this.moving = false

    // 粒子系统
    this.particles = []

    // 闪烁效果
    this.flashTimer = 0
    this.isFlashing = false

    // 脚部阴影
    this.shadowOffsetY = this.size * 1.2
  }

  update(input, deltaTime, canvasWidth, canvasHeight) {
    const movement = input.getMovement()
    this.lastX = this.x
    this.lastY = this.y

    this.x += movement.x * this.speed
    this.y += movement.y * this.speed

    // 边界检测
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x))
    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y))

    // 检测移动状态
    this.moving = movement.x !== 0 || movement.y !== 0

    // 移动倾斜
    if (this.moving) {
      this.targetTiltAngle = movement.x * 0.15 // 最大15度倾斜
    } else {
      this.targetTiltAngle = 0
    }
    // lerp 倾斜角度
    this.tiltAngle += (this.targetTiltAngle - this.tiltAngle) * 0.2

    // 呼吸动画
    this.breatheTime += deltaTime * 0.005
    this.breatheOffset = Math.sin(this.breatheTime) * 2

    // 生成移动粒子
    if (this.moving && Math.random() > 0.5) {
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y + this.size,
        vx: -movement.x * 0.5 + (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1,
        life: 1,
        size: 3 + Math.random() * 2
      })
    }

    // 更新粒子
    this.particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.05
    })
    this.particles = this.particles.filter(p => p.life > 0)

    // 更新闪烁
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime
      if (this.flashTimer <= 0) {
        this.isFlashing = false
      }
    }
  }

  draw(ctx) {
    ctx.save()

    // 绘制脚部阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.ellipse(this.x, this.y + this.shadowOffsetY, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()

    // 绘制粒子
    this.particles.forEach(p => {
      ctx.fillStyle = `rgba(100, 100, 120, ${p.life * 0.5})`
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    })

    // 移动中心点（考虑呼吸动画）
    const drawY = this.y + this.breatheOffset

    ctx.translate(this.x, drawY)
    ctx.rotate(this.tiltAngle)

    // 闪烁效果
    if (this.isFlashing) {
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // ===== 像素骑士绘制 =====

    // 身体（深蓝色盔甲）
    ctx.fillStyle = this.color
    ctx.fillRect(-this.size * 0.5, -this.size * 0.2, this.size, this.size * 0.8)

    // 盔甲高光
    ctx.fillStyle = '#4a7fff'
    ctx.fillRect(-this.size * 0.5, -this.size * 0.2, this.size * 0.3, this.size * 0.3)

    // 盔甲阴影
    ctx.fillStyle = '#2a4f9d'
    ctx.fillRect(this.size * 0.2, this.size * 0.2, this.size * 0.3, this.size * 0.4)

    // 头盔
    ctx.fillStyle = '#666'
    ctx.fillRect(-this.size * 0.4, -this.size * 0.9, this.size * 0.8, this.size * 0.5)

    // 头盔面罩
    ctx.fillStyle = '#444'
    ctx.fillRect(-this.size * 0.35, -this.size * 0.75, this.size * 0.7, this.size * 0.25)

    // 眼睛（透过面罩）
    ctx.fillStyle = '#fff'
    ctx.fillRect(-this.size * 0.25, -this.size * 0.72, this.size * 0.15, this.size * 0.12)
    ctx.fillRect(this.size * 0.1, -this.size * 0.72, this.size * 0.15, this.size * 0.12)

    // 头盔顶部
    ctx.fillStyle = '#888'
    ctx.fillRect(-this.size * 0.3, -this.size * 0.95, this.size * 0.6, this.size * 0.1)

    // 腿部
    ctx.fillStyle = '#555'
    ctx.fillRect(-this.size * 0.4, this.size * 0.5, this.size * 0.25, this.size * 0.35)
    ctx.fillRect(this.size * 0.15, this.size * 0.5, this.size * 0.25, this.size * 0.35)

    // 脚部
    ctx.fillStyle = '#333'
    ctx.fillRect(-this.size * 0.45, this.size * 0.8, this.size * 0.35, this.size * 0.15)
    ctx.fillRect(this.size * 0.1, this.size * 0.8, this.size * 0.35, this.size * 0.15)

    // 绘制武器（剑）
    ctx.fillStyle = '#c0c0c0'
    // 剑身
    ctx.fillRect(this.size * 0.5, -this.size * 0.1, this.size * 0.8, this.size * 0.12)
    // 剑柄
    ctx.fillStyle = '#8b4513'
    ctx.fillRect(this.size * 0.4, -this.size * 0.15, this.size * 0.15, this.size * 0.2)
    // 剑格
    ctx.fillStyle = '#ffd700'
    ctx.fillRect(this.size * 0.38, -this.size * 0.2, this.size * 0.2, this.size * 0.05)
    ctx.fillRect(this.size * 0.38, this.size * 0.08, this.size * 0.2, this.size * 0.05)

    ctx.restore()

    // 绘制血条（玩家头顶）
    const barWidth = this.size * 1.5
    const barHeight = 4
    const barY = this.y - this.size - 20 + this.breatheOffset
    const healthPercent = this.health / this.maxHealth

    ctx.fillStyle = '#333'
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight)
    ctx.fillStyle = '#e94560'
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight)
  }

  takeDamage(amount) {
    this.health -= amount
    this.triggerFlash()
    if (this.health <= 0) {
      this.health = 0
      return true
    }
    return false
  }

  triggerFlash() {
    this.isFlashing = true
    this.flashTimer = 50
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth)
  }

  addExp(amount) {
    this.exp += amount
    const expNeeded = this.level * 50
    if (this.exp >= expNeeded) {
      this.exp -= expNeeded
      this.level++
      this.maxHealth += 10
      this.health = this.maxHealth
      this.attack += 2
      return true
    }
    return false
  }

  canAttack(now) {
    return now - this.lastAttack >= this.attackSpeed
  }

  attackNow(now) {
    this.lastAttack = now
  }

  addCoin(amount) {
    this.coin += amount
  }

  spendCoin(amount) {
    if (this.coin >= amount) {
      this.coin -= amount
      return true
    }
    return false
  }

  addWeapon(weapon) {
    if (!this.weapons.includes(weapon)) {
      this.weapons.push(weapon)
    }
  }

  upgradeHealth() {
    this.maxHealth += 25
    this.health = this.maxHealth
  }

  upgradeAttack() {
    this.attack += 5
  }
}