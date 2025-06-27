// src/registerServiceWorker.ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => {
    console.log('Service Worker Registered');
  }).catch((error) => {
    console.log('Service Worker registration failed: ', error);
  });
}
