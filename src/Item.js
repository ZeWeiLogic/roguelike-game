import { ProceduralGenerator } from './ProceduralGenerator.js'

// 道具类型
const ITEM_TYPES = ['health', 'coin', 'weapon', 'key']

// 道具类
export class Item {
  constructor(x, y, type = 'coin') {
    this.x = x
    this.y = y
    this.size = 12
    this.type = type
    this.value = type === 'coin' ? 10 : (type === 'health' ? 20 : 1)
    this.generator = new ProceduralGenerator(Date.now() + Math.random() * 10000)
    this.bobOffset = Math.random() * Math.PI * 2
    this.collected = false
  }

  update(time) {
    // 上下浮动效果
    this.bobY = Math.sin(time / 300 + this.bobOffset) * 3
  }

  draw(ctx) {
    if (this.collected) return

    this.generator.generateItem(ctx, this.x, this.y + (this.bobY || 0), this.size, this.type)
  }

  collidesWith(player) {
    const dx = this.x - player.x
    const dy = this.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < this.size + player.size
  }

  collect() {
    this.collected = true
    return this
  }
}

// 掉落物生成器
export class DropGenerator {
  constructor() {
    this.generator = new ProceduralGenerator(Date.now())
  }

  createDrop(x, y) {
    const rand = Math.random()
    if (rand < 0.6) {
      return new Item(x, y, 'coin')
    } else if (rand < 0.85) {
      return new Item(x, y, 'health')
    } else {
      return new Item(x, y, 'weapon')
    }
  }
}