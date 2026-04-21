import { Game } from './Game.js'

const game = new Game('game-canvas')
game.start()

// PWA install prompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
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