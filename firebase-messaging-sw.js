importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ഫയർബേസ് കോൺഫിഗറേഷൻ
firebase.initializeApp({
    apiKey: "AIzaSyAwJCSwpj9EOd40IJrmI7drsURumljWRo8",
    authDomain: "directory-f4474.firebaseapp.com",
    projectId: "directory-f4474",
    storageBucket: "directory-f4474.firebasestorage.app",
    messagingSenderId: "681119733857",
    appId: "1:681119733857:web:e77d5ab9571a35aff1f220"
});

const messaging = firebase.messaging();

// ബാക്ക്ഗ്രൗണ്ടിൽ മെസ്സേജ് വരുമ്പോൾ
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received: ', payload);
  const notificationTitle = payload.notification.title || "പുതിയ അറിയിപ്പ്";
  const notificationOptions = {
    body: payload.notification.body || "വിശദാംശങ്ങൾക്കായി ആപ്പ് തുറക്കുക",
    icon: 'log.png', // ഇവിടെ log.png എന്ന് മാറ്റിയിട്ടുണ്ട്
    badge: 'log.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// നോട്ടിഫിക്കേഷനിൽ ക്ലിക്ക് ചെയ്താൽ ആപ്പ് തുറക്കാൻ
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

// മറ്റ് ഫയലുകൾ ഓഫ്‌ലൈനിൽ ലഭ്യമാക്കാൻ (Caching)
const cacheName = 'viva-directory-v3'; 
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './log.png' // ഇവിടെയും log.png എന്ന് നൽകുക
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
