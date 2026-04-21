// 程序化生成器 - 生成角色、武器、道具的视觉外观
export class ProceduralGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed
    this.rng = this.createRNG(seed)
  }

  createRNG(seed) {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
  }

  random() {
    return this.rng()
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  randomColor() {
    return `hsl(${this.randomInt(0, 360)}, ${this.randomInt(50, 80)}%, ${this.randomInt(50, 70)}%)`
  }

  // 生成角色图像
  generateCharacter(ctx, x, y, size, type = 'warrior') {
    const colors = {
      body: this.randomColor(),
      head: this.randomColor(),
      weapon: this.randomColor(),
      accent: this.randomColor()
    }

    ctx.save()

    // 身体
    ctx.fillStyle = colors.body
    if (type === 'warrior') {
      ctx.fillRect(x - size * 0.3, y - size * 0.2, size * 0.6, size * 0.6)
    } else if (type === 'mage') {
      ctx.beginPath()
      ctx.moveTo(x, y - size * 0.4)
      ctx.lineTo(x - size * 0.4, y + size * 0.3)
      ctx.lineTo(x + size * 0.4, y + size * 0.3)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.fillRect(x - size * 0.3, y - size * 0.2, size * 0.6, size * 0.6)
    }

    // 头部
    ctx.fillStyle = colors.head
    ctx.beginPath()
    ctx.arc(x, y - size * 0.35, size * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x - size * 0.1, y - size * 0.38, size * 0.06, 0, Math.PI * 2)
    ctx.arc(x + size * 0.1, y - size * 0.38, size * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(x - size * 0.1, y - size * 0.38, size * 0.03, 0, Math.PI * 2)
    ctx.arc(x + size * 0.1, y - size * 0.38, size * 0.03, 0, Math.PI * 2)
    ctx.fill()

    // 装饰
    ctx.fillStyle = colors.accent
    const decoration = this.randomInt(0, 3)
    if (decoration === 0) {
      // 角
      ctx.beginPath()
      ctx.moveTo(x - size * 0.15, y - size * 0.55)
      ctx.lineTo(x - size * 0.1, y - size * 0.7)
      ctx.lineTo(x - size * 0.05, y - size * 0.55)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x + size * 0.15, y - size * 0.55)
      ctx.lineTo(x + size * 0.1, y - size * 0.7)
      ctx.lineTo(x + size * 0.05, y - size * 0.55)
      ctx.fill()
    } else if (decoration === 1) {
      // 帽子
      ctx.fillRect(x - size * 0.2, y - size * 0.6, size * 0.4, size * 0.1)
      ctx.fillRect(x - size * 0.15, y - size * 0.7, size * 0.3, size * 0.12)
    } else if (decoration === 2) {
      // 眼镜
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x - size * 0.1, y - size * 0.38, size * 0.08, 0, Math.PI * 2)
      ctx.arc(x + size * 0.1, y - size * 0.38, size * 0.08, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
    return colors
  }

  // 生成武器图像
  generateWeapon(ctx, x, y, size, weaponType) {
    const color = this.randomColor()
    ctx.save()
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3

    switch (weaponType) {
      case 'sword':
        // 剑身
        ctx.fillRect(x - size * 0.05, y - size * 0.5, size * 0.1, size * 0.6)
        // 剑柄
        ctx.fillRect(x - size * 0.15, y + size * 0.1, size * 0.3, size * 0.08)
        break
      case 'staff':
        // 杖身
        ctx.fillRect(x - size * 0.04, y - size * 0.4, size * 0.08, size * 0.8)
        // 法球
        ctx.beginPath()
        ctx.arc(x, y - size * 0.45, size * 0.15, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'gun':
        // 枪身
        ctx.fillRect(x - size * 0.1, y - size * 0.1, size * 0.35, size * 0.15)
        // 枪管
        ctx.fillRect(x + size * 0.25, y - size * 0.05, size * 0.2, size * 0.05)
        break
      case 'axe':
        // 斧柄
        ctx.fillRect(x - size * 0.04, y - size * 0.3, size * 0.08, size * 0.7)
        // 斧刃
        ctx.beginPath()
        ctx.moveTo(x - size * 0.04, y - size * 0.3)
        ctx.lineTo(x - size * 0.3, y - size * 0.1)
        ctx.lineTo(x - size * 0.04, y + size * 0.1)
        ctx.closePath()
        ctx.fill()
        break
      default:
        ctx.fillRect(x - size * 0.05, y - size * 0.4, size * 0.1, size * 0.6)
    }
    ctx.restore()
    return color
  }

  // 生成道具图像
  generateItem(ctx, x, y, size, itemType) {
    ctx.save()
    switch (itemType) {
      case 'health':
        // 血瓶
        ctx.fillStyle = '#e94560'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.fillRect(x - size * 0.08, y - size * 0.2, size * 0.16, size * 0.3)
        break
      case 'coin':
        // 金币
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#b8860b'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.15, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'weapon':
        // 武器箱
        ctx.fillStyle = '#8b4513'
        ctx.fillRect(x - size * 0.3, y - size * 0.25, size * 0.6, size * 0.5)
        ctx.fillStyle = '#ffd700'
        ctx.fillRect(x - size * 0.05, y - size * 0.1, size * 0.1, size * 0.2)
        break
      case 'key':
        // 钥匙
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(x - size * 0.15, y - size * 0.1, size * 0.12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(x - size * 0.05, y - size * 0.05, size * 0.35, size * 0.1)
        ctx.fillRect(x + size * 0.15, y + size * 0.05, size * 0.08, size * 0.1)
        ctx.fillRect(x + size * 0.05, y + size * 0.05, size * 0.08, size * 0.1)
        break
      default:
        ctx.fillStyle = this.randomColor()
        ctx.fillRect(x - size * 0.2, y - size * 0.2, size * 0.4, size * 0.4)
    }
    ctx.restore()
  }

  // 生成敌人图像
  generateEnemy(ctx, x, y, size, enemyType) {
    const color = this.randomColor()
    ctx.save()
    ctx.fillStyle = color

    switch (enemyType) {
      case 'slime':
        ctx.beginPath()
        ctx.arc(x, y + size * 0.1, size * 0.4, 0, Math.PI)
        ctx.fill()
        // 眼睛
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x - size * 0.15, y, size * 0.1, 0, Math.PI * 2)
        ctx.arc(x + size * 0.15, y, size * 0.1, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(x - size * 0.15, y + size * 0.02, size * 0.05, 0, Math.PI * 2)
        ctx.arc(x + size * 0.15, y + size * 0.02, size * 0.05, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'skeleton':
        // 骷髅
        ctx.fillStyle = '#f5f5dc'
        ctx.beginPath()
        ctx.arc(x, y - size * 0.2, size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        // 眼睛
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(x - size * 0.1, y - size * 0.22, size * 0.06, 0, Math.PI * 2)
        ctx.arc(x + size * 0.1, y - size * 0.22, size * 0.06, 0, Math.PI * 2)
        ctx.fill()
        // 身体
        ctx.fillStyle = '#f5f5dc'
        ctx.fillRect(x - size * 0.15, y, size * 0.3, size * 0.4)
        break
      case 'demon':
        // 恶魔
        ctx.fillStyle = '#8b0000'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2)
        ctx.fill()
        // 角
        ctx.beginPath()
        ctx.moveTo(x - size * 0.25, y - size * 0.25)
        ctx.lineTo(x - size * 0.35, y - size * 0.5)
        ctx.lineTo(x - size * 0.15, y - size * 0.3)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(x + size * 0.25, y - size * 0.25)
        ctx.lineTo(x + size * 0.35, y - size * 0.5)
        ctx.lineTo(x + size * 0.15, y - size * 0.3)
        ctx.fill()
        // 眼睛
        ctx.fillStyle = '#ff0'
        ctx.beginPath()
        ctx.arc(x - size * 0.12, y - size * 0.05, size * 0.08, 0, Math.PI * 2)
        ctx.arc(x + size * 0.12, y - size * 0.05, size * 0.08, 0, Math.PI * 2)
        ctx.fill()
        break
      default:
        ctx.beginPath()
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.restore()
    return color
  }
}