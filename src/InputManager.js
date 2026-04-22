// 输入管理器 - 处理键盘和触摸输入
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.keys = {}
    this.directions = { up: false, down: false, left: false, right: false }

    // 动态摇杆状态
    this.joystick = {
      active: false,
      baseX: 0,
      baseY: 0,
      stickX: 0,
      stickY: 0,
      fingerId: null
    }

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
    // 统一使用 touch 事件，避免 pointer events 冲突
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()

      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // 只在左半边屏幕创建摇杆
      if (x < this.canvas.width / 2 && !this.joystick.active) {
        this.joystick.active = true
        this.joystick.baseX = x
        this.joystick.baseY = y
        this.joystick.stickX = x
        this.joystick.stickY = y
        this.joystick.fingerId = touch.identifier
      }
    }, { passive: false })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()

      // 找到对应的触摸点
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i]
        if (touch.identifier === this.joystick.fingerId && this.joystick.active) {
          const rect = this.canvas.getBoundingClientRect()
          let x = touch.clientX - rect.left
          let y = touch.clientY - rect.top

          // 计算偏移量
          const dx = x - this.joystick.baseX
          const dy = y - this.joystick.baseY
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 限制最大偏移距离
          const maxDistance = 60
          if (distance > maxDistance) {
            const normalizedDx = dx / distance
            const normalizedDy = dy / distance
            x = this.joystick.baseX + normalizedDx * maxDistance
            y = this.joystick.baseY + normalizedDy * maxDistance
          }

          this.joystick.stickX = x
          this.joystick.stickY = y
        }
      }
    }, { passive: false })

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()

      // 检查是否是我们追踪的手指
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystick.fingerId) {
          this.joystick.active = false
          this.joystick.fingerId = null
        }
      }
    }, { passive: false })

    this.canvas.addEventListener('touchcancel', (e) => {
      this.joystick.active = false
      this.joystick.fingerId = null
    }, { passive: false })
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

    // 键盘输入
    if (this.directions.up) dy -= 1
    if (this.directions.down) dy += 1
    if (this.directions.left) dx -= 1
    if (this.directions.right) dx += 1

    // 动态摇杆输入
    if (this.joystick.active) {
      const jdx = this.joystick.stickX - this.joystick.baseX
      const jdy = this.joystick.stickY - this.joystick.baseY
      const distance = Math.sqrt(jdx * jdx + jdy * jdy)

      if (distance > 10) { // 死区
        const maxDistance = 60
        const factor = Math.min(distance, maxDistance) / maxDistance
        dx = (jdx / distance) * factor
        dy = (jdy / distance) * factor
      } else {
        return { x: 0, y: 0 }
      }
    }

    // 归一化
    const length = Math.sqrt(dx * dx + dy * dy)
    if (length > 0) {
      return { x: dx / length, y: dy / length }
    }
    return { x: 0, y: 0 }
  }

  // 获取摇杆数据（用于绘制）
  getJoystickData() {
    return {
      active: this.joystick.active,
      baseX: this.joystick.baseX,
      baseY: this.joystick.baseY,
      stickX: this.joystick.stickX,
      stickY: this.joystick.stickY
    }
  }

  // 检查触摸是否在左半边（用于菜单开始游戏）
  isTouchInLeftHalf(x, y) {
    return x < this.canvas.width / 2
  }

  isKeyPressed(code) {
    return this.keys[code] === true
  }
}