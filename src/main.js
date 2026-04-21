import { Game } from './Game.js'

const game = new Game('game-canvas')
game.start()

// PWA install prompt - 增强版
let deferredPrompt

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e

  const btn = document.getElementById('install-prompt')
  btn.style.display = 'block'

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        btn.style.display = 'none'
      }
      deferredPrompt = null
    }
  })
})

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('install-prompt')
  if (btn) btn.style.display = 'none'
  deferredPrompt = null
  console.log('PWA installed successfully')
})

// 检查是否已经安装
if (window.matchMedia('(display-mode: standalone)').matches) {
  const btn = document.getElementById('install-prompt')
  if (btn) btn.style.display = 'none'
}