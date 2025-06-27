// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // または 'prompt'
      manifest: {
        name: 'Twitter Profile Memo',
        short_name: 'Twitter Memo',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        share_target: {
          action: '/share-target', // 共有されたデータを受け取るURL
          method: 'GET',           // または 'POST'
          params: {
            title: 'title',        // 共有データに含まれるタイトル
            text: 'text',          // 共有データに含まれるテキスト
            url: 'url',            // 共有データに含まれるURL
          },
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico}'],
      },
    }),
  ],
});