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

// ബാക്ക്ഗ്രൗണ്ടിൽ മെസ്സേജ് വരുമ്പോൾ
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'log.png', // പാത്ത് ശരിയാണെന്ന് ഉറപ്പാക്കുക
    data: { url: self.location.origin } // നോട്ടിഫിക്കേഷനിൽ ക്ലിക്ക് ചെയ്താൽ ആപ്പ് തുറക്കാൻ
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// നോട്ടിഫിക്കേഷനിൽ ക്ലിക്ക് ചെയ്താൽ ആപ്പ് തുറക്കാനുള്ള കോഡ്
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// മാനിഫെസ്റ്റിലും മറ്റും ഉള്ള കാഷിംഗ് കോഡ് താഴെ തുടരാം
const cacheName = 'viva-directory-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './sad.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
