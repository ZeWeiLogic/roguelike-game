export class ShopSystem {
  constructor() {
    this.upgrades = [
      {
        name: '生命强化',
        description: '最大生命值 +25',
        cost: 30,
        type: 'health'
      },
      {
        name: '攻击力强化',
        description: '攻击力 +5',
        cost: 40,
        type: 'attack'
      },
      {
        name: '移动速度',
        description: '移动速度 +0.5',
        cost: 35,
        type: 'speed'
      },
      {
        name: '攻击速度',
        description: '攻击间隔 -100ms',
        cost: 50,
        type: 'attackSpeed'
      },
      {
        name: '暴击几率',
        description: '暴击率 +5%',
        cost: 45,
        type: 'crit'
      },
      {
        name: '恢复生命',
        description: '立即恢复 50 HP',
        cost: 15,
        type: 'heal'
      }
    ]
    this.purchased = []
    this.closeButton = null
  }

  reset() {
    this.purchased = []
    this.closeButton = null
  }

  getAvailableUpgrades() {
    return this.upgrades.filter((upgrade, index) => !this.purchased.includes(index))
  }

  purchase(upgradeIndex, player) {
    if (this.purchased.includes(upgradeIndex)) {
      return false
    }

    const upgrade = this.upgrades[upgradeIndex]
    if (player.coin < upgrade.cost) {
      return false
    }

    if (player.spendCoin(upgrade.cost)) {
      this.purchased.push(upgradeIndex)

      switch (upgrade.type) {
        case 'health':
          player.upgradeHealth()
          break
        case 'attack':
          player.upgradeAttack()
          break
        case 'speed':
          player.speed += 0.5
          break
        case 'attackSpeed':
          player.attackSpeed = Math.max(100, player.attackSpeed - 100)
          break
        case 'crit':
          player.critChance = Math.min(0.8, player.critChance + 0.05)
          break
        case 'heal':
          player.heal(50)
          break
      }
      return true
    }
    return false
  }

  draw(ctx, canvasWidth, canvasHeight, player) {
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 商店标题
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 5
    ctx.fillText('商店', canvasWidth / 2, 50)
    ctx.shadowBlur = 0

    // 关闭按钮
    const closeBtnX = 20
    const closeBtnY = 20
    const closeBtnW = 80
    const closeBtnH = 50
    ctx.fillStyle = '#e94560'
    this.roundRect(ctx, closeBtnX, closeBtnY, closeBtnW, closeBtnH, 10)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('关闭', closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2 + 6)

    this.closeButton = { x: closeBtnX, y: closeBtnY, w: closeBtnW, h: closeBtnH }

    // 金币显示
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 24px Arial'
    ctx.fillText(`💰 ${player.coin}`, canvasWidth / 2, 110)

    // 升级选项 - 网格布局
    const available = this.getAvailableUpgrades()
    const itemW = 200
    const itemH = 90
    const gap = 20

    // 计算需要几行
    const cols = Math.min(4, available.length)
    const rows = Math.ceil(available.length / cols)
    const totalW = cols * itemW + (cols - 1) * gap
    const startX = (canvasWidth - totalW) / 2
    const startY = 150

    available.forEach((upgrade, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = startX + col * (itemW + gap)
      const y = startY + row * (itemH + gap)

      // 卡片背景
      ctx.fillStyle = '#2a2a4a'
      this.roundRect(ctx, x, y, itemW, itemH, 12)
      ctx.fill()

      // 边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      this.roundRect(ctx, x, y, itemW, itemH, 12)
      ctx.stroke()

      // 名称
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(upgrade.name, x + 15, y + 30)

      // 描述
      ctx.fillStyle = '#aaa'
      ctx.font = '14px Arial'
      ctx.fillText(upgrade.description, x + 15, y + 55)

      // 价格
      ctx.fillStyle = player.coin >= upgrade.cost ? '#4a9' : '#e94560'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`${upgrade.cost}`, x + itemW - 15, y + 50)
    })

    // 提示
    ctx.fillStyle = '#666'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('点击选项购买 | 点击关闭按钮退出', canvasWidth / 2, canvasHeight - 40)
  }

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

  handleClick(x, y, player, canvasWidth) {
    // 检查关闭按钮
    if (this.closeButton) {
      const btn = this.closeButton
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        return 'close'
      }
    }

    // 检查升级选项
    const available = this.getAvailableUpgrades()
    const itemW = 200
    const itemH = 90
    const gap = 20
    const cols = Math.min(4, available.length)
    const totalW = cols * itemW + (cols - 1) * gap
    const startX = (canvasWidth - totalW) / 2
    const startY = 150

    for (let i = 0; i < available.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const itemX = startX + col * (itemW + gap)
      const itemY = startY + row * (itemH + gap)

      if (x >= itemX && x <= itemX + itemW && y >= itemY && y <= itemY + itemH) {
        const upgradeIndex = this.upgrades.indexOf(available[i])
        return this.purchase(upgradeIndex, player) ? 'purchased' : 'failed'
      }
    }
    return 'none'
  }
}