import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import './assets/styles/themes.css'; // ★追加: テーマCSSをグローバルにインポート

createApp(App).mount('#app');
