import { createApp } from 'vue'
import App from './App.vue'

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