// 商店系统
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
  }

  reset() {
    this.purchased = []
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 商店标题
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('商店', canvasWidth / 2, 50)

    // 金币显示
    ctx.fillStyle = '#ffd700'
    ctx.font = '18px Arial'
    ctx.fillText(`金币: ${player.coin}`, canvasWidth / 2, 85)

    // 升级选项
    const available = this.getAvailableUpgrades()
    const startY = 120
    const itemHeight = 60

    available.forEach((upgrade, index) => {
      const actualIndex = this.upgrades.indexOf(upgrade)
      const y = startY + index * itemHeight

      // 背景
      ctx.fillStyle = '#2a2a4a'
      ctx.fillRect(canvasWidth / 2 - 150, y, 300, 50)

      // 名称
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(upgrade.name, canvasWidth / 2 - 140, y + 20)

      // 描述
      ctx.fillStyle = '#aaa'
      ctx.font = '12px Arial'
      ctx.fillText(upgrade.description, canvasWidth / 2 - 140, y + 38)

      // 价格
      ctx.fillStyle = player.coin >= upgrade.cost ? '#4a9' : '#e94560'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(`${upgrade.cost}`, canvasWidth / 2 + 140, y + 30)
    })

    // 提示
    ctx.fillStyle = '#888'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('点击选项购买 | 按 ESC 关闭', canvasWidth / 2, canvasHeight - 30)
  }

  handleClick(x, y, player) {
    const available = this.getAvailableUpgrades()
    const startY = 120
    const itemHeight = 60
    const itemX = 150 // canvasWidth/2 - 150
    const itemWidth = 300

    for (let i = 0; i < available.length; i++) {
      const itemY = startY + i * itemHeight
      if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + 50) {
        const upgradeIndex = this.upgrades.indexOf(available[i])
        return this.purchase(upgradeIndex, player)
      }
    }
    return false
  }
}