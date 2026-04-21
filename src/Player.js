import { ProceduralGenerator } from './ProceduralGenerator.js'

// 玩家类
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
    this.color = this.generator.randomColor()
  }

  update(input, deltaTime, canvasWidth, canvasHeight) {
    const movement = input.getMovement()
    this.x += movement.x * this.speed
    this.y += movement.y * this.speed

    // 边界检测
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x))
    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y))
  }

  draw(ctx) {
    // 绘制身体
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    // 绘制装饰
    ctx.fillStyle = '#e94560'
    ctx.beginPath()
    ctx.arc(this.x, this.y - this.size * 0.8, this.size * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.x - this.size * 0.15, this.y - this.size * 0.85, this.size * 0.12, 0, Math.PI * 2)
    ctx.arc(this.x + this.size * 0.15, this.y - this.size * 0.85, this.size * 0.12, 0, Math.PI * 2)
    ctx.fill()

    // 绘制武器
    this.generator.generateWeapon(ctx, this.x + this.size * 1.5, this.y, this.size, this.weapons[0])

    // 绘制血条
    const barWidth = this.size * 2
    const barHeight = 4
    const healthPercent = this.health / this.maxHealth

    ctx.fillStyle = '#333'
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 15, barWidth, barHeight)
    ctx.fillStyle = '#e94560'
    ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 15, barWidth * healthPercent, barHeight)
  }

  takeDamage(amount) {
    this.health -= amount
    if (this.health <= 0) {
      this.health = 0
      return true // 死亡
    }
    return false
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
      return true // 升级
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