// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue()],
// })


// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt'],
    manifest: {
      name: 'Twitterプロフィールメモ',
      short_name: 'Twitterメモ',
      description: 'Twitterのプロフィールメモを簡単に保存できるアプリ',
      theme_color: '#42b983',
      icons: [
        {
          src: 'icon.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    }
  })]
});
