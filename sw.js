importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAwJCSwpj9EOd40IJrmI7drsURumljWRo8",
    authDomain: "directory-f4474.firebaseapp.com",
    projectId: "directory-f4474",
    storageBucket: "directory-f4474.firebasestorage.app",
    messagingSenderId: "681119733857",
    appId: "1:681119733857:web:e77d5ab9571a35aff1f220"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ബാക്ക്ഗ്രൗണ്ടിൽ മെസ്സേജ് വരുമ്പോൾ കാണിക്കാൻ
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './sad.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// പഴയ കാഷിംഗ് കോഡ് താഴെ തുടർന്ന് ചേർക്കാം
const cacheName = 'viva-directory-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './sad.png' // ഐക്കൺ കൂടി ആഡ് ചെയ്യുന്നത് നന്നായിരിക്കും
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
