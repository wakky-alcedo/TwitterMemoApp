import { createApp } from 'vue'
import './registerServiceWorker'  // ← PWA登録を追加
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
