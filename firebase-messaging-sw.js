// ✅ IMPORTANT: This service worker handles background web notifications only
// Foreground notifications are handled by Flutter app directly

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDbN7cvYX6FS3CN7h1zxpT_uVdoNMH2P7k",
  authDomain: "tasky-11.firebaseapp.com",
  projectId: "tasky-11",
  messagingSenderId: "301264486631",
  appId: "1:301264486631:web:06e39f7e48d1d36c15e242",
});

const messaging = firebase.messaging();

// Handle background messages ONLY (when app is not active/visible)
messaging.onBackgroundMessage(function(payload) {
  console.log('🌐 Background message received in service worker:', payload);

  const notificationTitle = payload.notification?.title || 'Taskyz Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-watchos-1024x1024.png',
    badge: '/icons/icon-watchos-1024x1024.png',
    tag: 'taskyz-background-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-watchos-1024x1024.png'
      }
    ],
    data: payload.data || {}
  };

  console.log('📤 Showing background notification:', notificationTitle);

  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ Background notification shown successfully');
    })
    .catch((error) => {
      console.error('❌ Error showing background notification:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        console.log('🔍 Found clients:', clientList.length);

        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('localhost') && 'focus' in client) {
            console.log('✅ Focusing existing window');
            return client.focus();
          }
        }

        // If app is not open, open it
        if (clients.openWindow) {
          console.log('🚀 Opening new window');
          return clients.openWindow('/');
        }
      })
    );
  }
});