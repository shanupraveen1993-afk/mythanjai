// Firebase Cloud Messaging Background Service Worker for Namma Thanjai
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase inside Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDummyKeyForSwRegistration",
  projectId: "mythanjai",
  messagingSenderId: "9994837342",
  appId: "1:9994837342:web:nammathanjai"
});

const messaging = firebase.messaging();

// Background Push Notification Event Listener
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background push payload:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Namma Thanjai Notification';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update in Thanjavur.',
    icon: payload.notification?.icon || '/namma_thanjai_logo.png',
    badge: '/store_icon.png',
    data: {
      url: payload.data?.url || payload.data?.click_action || '/'
    },
    vibrate: [100, 50, 100],
    tag: payload.data?.tag || 'namma_thanjai_push'
  };

  self.registration.showNotification(title, options);
});

// System Notification Tap Handler: Deep-Link directly to Chat or Listing page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus open tab if available
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
