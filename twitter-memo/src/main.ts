import { createApp } from 'vue'
import App from './App.vue'

// PWA Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// アプリケーション初期化
const app = createApp(App)

// エラーハンドリング
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
}

// 開発環境でのパフォーマンス追跡
if (import.meta.env.DEV) {
  app.config.performance = true
}

app.mount('#app')