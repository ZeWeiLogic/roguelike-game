// 关卡/房间管理器
export class StageManager {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.room = 1
    this.enemiesRemaining = 0
    this.roomType = 'normal' // normal, shop, boss
    this.doorOpen = false
    this.enemiesKilled = 0
  }

  reset(width, height) {
    this.width = width
    this.height = height
    this.room = 1
    this.enemiesRemaining = 3 // 第一房有3个敌人
    this.roomType = 'normal'
    this.doorOpen = false
    this.enemiesKilled = 0
  }

  nextRoom() {
    this.room++
    this.enemiesKilled = 0

    // 判断房间类型
    if (this.room % 20 === 0) {
      this.roomType = 'boss'
      this.enemiesRemaining = 1 // BOSS
    } else if (this.room % 5 === 0) {
      this.roomType = 'shop'
      this.enemiesRemaining = 0
    } else {
      this.roomType = 'normal'
      this.enemiesRemaining = 3 + Math.floor(this.room / 3)
    }
    this.doorOpen = false
  }

  spawnEnemies() {
    if (this.roomType === 'shop') {
      return []
    }

    const enemies = []
    const count = this.roomType === 'boss' ? 1 : this.enemiesRemaining

    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4)
      let x, y

      switch (side) {
        case 0: // 上
          x = Math.random() * this.width
          y = 50
          break
        case 1: // 下
          x = Math.random() * this.width
          y = this.height - 50
          break
        case 2: // 左
          x = 50
          y = Math.random() * this.height
          break
        case 3: // 右
          x = this.width - 50
          y = Math.random() * this.height
          break
      }

      enemies.push({
        x,
        y,
        level: Math.max(1, Math.floor(this.room / 5))
      })
    }

    return enemies
  }

  enemyKilled() {
    this.enemiesKilled++
    if (this.enemiesKilled >= this.enemiesRemaining && this.roomType !== 'shop') {
      this.doorOpen = true
    }
  }

  draw(ctx, canvasWidth, canvasHeight) {
    // 绘制房间边框
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20)

    // 绘制门
    if (this.doorOpen) {
      ctx.fillStyle = '#4a9'
      ctx.fillRect(canvasWidth / 2 - 30, canvasHeight - 15, 60, 10)
    }

    // 绘制房间信息
    ctx.fillStyle = '#fff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`房间 ${this.room}`, canvasWidth / 2, 25)

    // 房间类型标签
    if (this.roomType === 'boss') {
      ctx.fillStyle = '#e94560'
      ctx.font = 'bold 20px Arial'
      ctx.fillText('BOSS', canvasWidth / 2, 50)
    } else if (this.roomType === 'shop') {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 18px Arial'
      ctx.fillText('商店', canvasWidth / 2, 50)
    }
  }
}