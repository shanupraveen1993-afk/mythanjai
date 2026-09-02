// Firebase Cloud Messaging Background Service Worker for Namma Thanjai
// This service worker enables background push notification delivery on Web/PWA
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Real Firebase configuration — must match firebase.ts
firebase.initializeApp({
  apiKey: "AIzaSyARIlmmsFmp6plkviJYVNEifLZH-vAw8yA",
  authDomain: "mythanjai-40db2.firebaseapp.com",
  projectId: "mythanjai-40db2",
  storageBucket: "mythanjai-40db2.firebasestorage.app",
  messagingSenderId: "368011719475",
  appId: "1:368011719475:web:1bd4950b7dbd8d5ffa0446",
});

const messaging = firebase.messaging();

// Background push notification handler
// Fires when a push arrives and the app is NOT in the foreground
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background push received:', payload.data?.type || 'unknown');

  const title = payload.notification?.title
    || payload.data?.title
    || 'Namma Thanjai';

  const body = payload.notification?.body
    || payload.data?.body
    || 'You have a new update.';

  // Route to the exact conversation if available
  const actionUrl = payload.data?.actionUrl
    || payload.data?.url
    || payload.data?.click_action
    || '/';

  const options = {
    body,
    icon: '/namma_thanjai_logo.png',
    badge: '/namma_thanjai_logo.png',
    data: { url: actionUrl },
    vibrate: [100, 50, 100],
    tag: payload.data?.conversationId || payload.data?.type || 'namma_thanjai_push',
    renotify: true,
    requireInteraction: false,
  };

  self.registration.showNotification(title, options);
});

// Notification tap handler: deep-link to exact chat conversation or page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app tab already open: focus it and navigate to exact destination
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab at the exact destination
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
