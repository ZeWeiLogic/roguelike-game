// 输入管理器 - 处理键盘和触摸输入
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.keys = {}
    this.touch = { x: 0, y: 0, active: false }
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

    // 触摸开始位置（用于检测是否是移动操作）
    this.touchStartX = 0
    this.touchStartY = 0

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
    // 使用 pointer events 来更好地处理移动端
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      this.handlePointerStart(e)
    }, { passive: false })

    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault()
      this.handlePointerMove(e)
    }, { passive: false })

    this.canvas.addEventListener('pointerup', (e) => {
      e.preventDefault()
      this.handlePointerEnd(e)
    }, { passive: false })

    this.canvas.addEventListener('pointercancel', (e) => {
      e.preventDefault()
      this.handlePointerEnd(e)
    }, { passive: false })

    // 键盘事件监听
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      this.updateDirections()
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
      this.updateDirections()
    })
  }

  handlePointerStart(e) {
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    this.touchStartX = x
    this.touchStartY = y

    // 只在左半边屏幕创建摇杆
    if (x < this.canvas.width / 2 && !this.joystick.active) {
      // 创建摇杆 - 在触摸位置生成
      this.joystick.active = true
      this.joystick.baseX = x
      this.joystick.baseY = y
      this.joystick.stickX = x
      this.joystick.stickY = y
      this.joystick.fingerId = e.pointerId

      this.canvas.setPointerCapture(e.pointerId)
    }
  }

  handlePointerMove(e) {
    // 只处理已捕获的触摸点
    if (e.pointerId !== this.joystick.fingerId) return

    if (this.joystick.active) {
      const rect = this.canvas.getBoundingClientRect()
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top

      // 即使手指滑出Canvas也继续追踪
      // 计算偏移量（相对于摇杆基点）
      const dx = x - this.joystick.baseX
      const dy = y - this.joystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 限制最大偏移距离为60px
      const maxDistance = 60
      if (distance > maxDistance) {
        // 归一化方向并限制距离
        const normalizedDx = dx / distance
        const normalizedDy = dy / distance
        x = this.joystick.baseX + normalizedDx * maxDistance
        y = this.joystick.baseY + normalizedDy * maxDistance
      }

      this.joystick.stickX = x
      this.joystick.stickY = y
    }
  }

  handlePointerEnd(e) {
    if (e.pointerId === this.joystick.fingerId) {
      this.joystick.active = false
      this.joystick.fingerId = null
    }
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
      const dx = this.joystick.stickX - this.joystick.baseX
      const dy = this.joystick.stickY - this.joystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 10) { // 死区
        // 归一化并乘以距离比例（距离越大速度越快）
        const maxDistance = 60
        const factor = Math.min(distance, maxDistance) / maxDistance
        dx = (dx / distance) * factor
        dy = (dy / distance) * factor
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

  isKeyPressed(code) {
    return this.keys[code] === true
  }
}