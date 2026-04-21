// 输入管理器 - 处理键盘和触摸输入
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.keys = {}
    this.touch = { x: 0, y: 0, active: false }
    this.directions = { up: false, down: false, left: false, right: false }

    this.setupKeyboard()
    this.setupTouch()
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      this.updateDirections()
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
      this.updateDirections()
    })
  }

  setupTouch() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      this.touch.x = touch.clientX - rect.left
      this.touch.y = touch.clientY - rect.top
      this.touch.active = true
    })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      this.touch.x = touch.clientX - rect.left
      this.touch.y = touch.clientY - rect.top
    })

    this.canvas.addEventListener('touchend', () => {
      this.touch.active = false
    })
  }

  updateDirections() {
    this.directions.up = this.keys['ArrowUp'] || this.keys['KeyW']
    this.directions.down = this.keys['ArrowDown'] || this.keys['KeyS']
    this.directions.left = this.keys['ArrowLeft'] || this.keys['KeyA']
    this.directions.right = this.keys['ArrowRight'] || this.keys['KeyD']
  }

  getMovement() {
    let dx = 0
    let dy = 0

    if (this.directions.up) dy -= 1
    if (this.directions.down) dy += 1
    if (this.directions.left) dx -= 1
    if (this.directions.right) dx += 1

    // 触摸输入 - 虚拟摇杆（只在屏幕左半边激活，方便横板游戏）
    if (this.touch.active) {
      const halfWidth = this.canvas.width / 2

      // 只有触摸屏幕左半部分才作为移动摇杆
      if (this.touch.x < halfWidth) {
        // 摇杆基点在左侧中央
        const joystickBaseX = halfWidth * 0.3
        const joystickBaseY = this.canvas.height * 0.75

        const touchDx = this.touch.x - joystickBaseX
        const touchDy = this.touch.y - joystickBaseY
        const distance = Math.sqrt(touchDx * touchDx + touchDy * touchDy)

        if (distance > 20) {
          const clampedDistance = Math.min(distance, 60)
          dx = touchDx / distance
          dy = touchDy / distance

          // 记录摇杆位置用于绘制
          this.joystickX = joystickBaseX + (touchDx / distance) * clampedDistance
          this.joystickY = joystickBaseY + (touchDy / distance) * clampedDistance
        } else {
          this.joystickX = joystickBaseX
          this.joystickY = joystickBaseY
        }
      }
    } else {
      this.joystickX = undefined
      this.joystickY = undefined
    }

    // 归一化
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > 0) {
      return { x: dx / length, y: dy / length }
    }
    return { x: 0, y: 0 }
  }

  // 获取摇杆位置（用于绘制）
  getJoystickPosition() {
    return {
      baseX: this.canvas.width * 0.3,
      baseY: this.canvas.height * 0.75,
      stickX: this.joystickX,
      stickY: this.joystickY
    }
  }

  isKeyPressed(code) {
    return this.keys[code] === true
  }
}