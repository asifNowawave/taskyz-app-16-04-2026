// ✅ IMPORTANT:
// This service worker handles BACKGROUND web notifications only
// Foreground notifications are handled by Flutter app directly

// Service Worker version - increment when making changes
const SW_VERSION = '1.0.3';

// Brave browser detection
function isBraveBrowser() {
  return (navigator.brave && navigator.brave.isBrave) || 
         navigator.userAgent.toLowerCase().indexOf('brave') > -1;
}

// Enhanced logging for Brave compatibility
function broadcastToClients(level, message, data) {
  const payload = {
    source: 'taskyz-sw',
    level: level || 'log',
    message: message || '',
    data: data !== undefined ? data : null,
    timestamp: new Date().toISOString(),
    browser: isBraveBrowser() ? 'brave' : 'other'
  };

  // Force immediate broadcast for Brave
  self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      if (clientList.length === 0) {
        // No clients, store in IndexedDB for later retrieval
        storeLogForLater(payload);
      }
      
      clientList.forEach((client) => {
        try {
          client.postMessage(payload);
          // For Brave, send twice to ensure delivery
          if (isBraveBrowser()) {
            setTimeout(() => client.postMessage(payload), 100);
          }
        } catch (e) {
          console.error('Failed to post message to client:', e);
        }
      });
    })
    .catch((err) => {
      console.error('Failed to match clients:', err);
    });
}

// Store logs for Brave when no clients are available
function storeLogForLater(payload) {
  try {
    // Use a simple array in global scope
    if (!self.pendingLogs) {
      self.pendingLogs = [];
    }
    self.pendingLogs.push(payload);
    // Keep only last 50 logs
    if (self.pendingLogs.length > 50) {
      self.pendingLogs.shift();
    }
  } catch (e) {
    // Ignore storage errors
  }
}

function swLog(message, data) {
  // Multiple console methods for Brave compatibility
  const logMessage = '[SW v' + SW_VERSION + '] ' + message;
  const logData = data !== undefined ? data : '';
  
  // Try multiple console methods
  console.log(logMessage, logData);
  console.info(logMessage, logData);
  
  // For Brave, also use console.warn to ensure visibility
  if (isBraveBrowser()) {
    console.warn('🔵 ' + logMessage, logData);
  }
  
  broadcastToClients('log', message, data);
}

function swError(message, data) {
  const errorMessage = '[SW v' + SW_VERSION + '] ' + message;
  const errorData = data !== undefined ? data : '';
  
  console.error(errorMessage, errorData);
  
  // For Brave, also use console.warn
  if (isBraveBrowser()) {
    console.warn('🔴 ' + errorMessage, errorData);
  }
  
  broadcastToClients('error', message, data);
}

// Cross-browser compatibility: Add install and activate handlers
self.addEventListener('install', function(event) {
  swLog('🔧 Service Worker installing... (version ' + SW_VERSION + ')');
  // Skip waiting to activate immediately (important for updates)
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  swLog('✅ Service Worker activated (version ' + SW_VERSION + ')');
  // Claim all clients immediately (important for first install)
  event.waitUntil(
    self.clients.claim().then(function() {
      swLog('✅ All clients claimed');
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// 🔥 Initialize Firebase with error handling
try {
  swLog('🔥 Initializing Firebase in Service Worker...');
  
  firebase.initializeApp({
    apiKey: "AIzaSyDbN7cvYX6FS3CN7h1zxpT_uVdoNMH2P7k",
    authDomain: "tasky-11.firebaseapp.com",
    projectId: "tasky-11",
    storageBucket: "tasky-11.firebasestorage.app",
    messagingSenderId: "301264486631",
    appId: "1:301264486631:web:06e39f7e48d1d36c15e242",
  });

  swLog('✅ Firebase initialized successfully');
  
  const messaging = firebase.messaging();
  swLog('✅ Firebase Messaging instance created');

  // 📩 Handle BACKGROUND messages from Firebase
  messaging.onBackgroundMessage(function (payload) {
    swLog('🔥 Firebase background message received', {
      messageId: payload.messageId || 'unknown',
      from: payload.from || 'unknown',
      hasNotification: !!payload.notification,
      hasData: !!payload.data
    });

    // Extract notification details with fallbacks
    const notificationTitle = 
      (payload.notification && payload.notification.title) || 
      (payload.data && payload.data.title) ||
      'Taskyz Notification';

    const notificationBody = 
      (payload.notification && payload.notification.body) || 
      (payload.data && payload.data.body) ||
      'You have a new notification';

    const notificationIcon = 
      (payload.notification && payload.notification.icon) || 
      '/icons/Icon-192.png';

    const notificationOptions = {
      body: notificationBody,
      icon: notificationIcon,
      badge: '/icons/Icon-192.png',
      tag: 'taskyz-notification-' + Date.now(),
      requireInteraction: false,
      vibrate: [200, 100, 200], // Vibration pattern for mobile browsers
      data: payload.data || {},
      // Cross-browser compatibility options
      silent: false,
      renotify: true,
      timestamp: Date.now()
    };

    swLog('📤 Showing notification', { 
      title: notificationTitle,
      body: notificationBody 
    });

    return self.registration
      .showNotification(notificationTitle, notificationOptions)
      .then(function() {
        swLog('✅ Notification shown successfully');
      })
      .catch(function(error) {
        swError('❌ Error showing notification', {
          name: error.name,
          message: error.message
        });
      });
  });

  swLog('✅ Background message handler registered');

} catch (e) {
  swError('❌ Error initializing Firebase in SW', {
    name: e.name,
    message: e.message,
    stack: e.stack
  });
}
// 🔔 Handle notification click (cross-browser compatible)
self.addEventListener('notificationclick', function (event) {
  swLog('🔔 Notification clicked', {
    action: event.action || 'default',
    title: (event.notification && event.notification.title) || 'unknown',
  });

  // Close the notification
  event.notification.close();

  // Handle the click action
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        swLog('🔍 Searching for open windows', { count: clientList.length });

        // Check if app is already open
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];

          // Check if this is our app window
          if (client.url.indexOf(self.location.origin) !== -1) {
            swLog('✅ Found open window, focusing it');
            if ('focus' in client) {
              return client.focus().then(function() {
                swLog('✅ Window focused successfully');
                return client;
              });
            }
            return client;
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          swLog('🚀 Opening new window');
          return clients.openWindow('/').then(function(windowClient) {
            swLog('✅ New window opened successfully');
            return windowClient;
          });
        } else {
          swLog('⚠️ Cannot open window - clients.openWindow not available');
        }
      })
      .catch(function(error) {
        swError('❌ Error handling notification click', {
          name: error.name,
          message: error.message
        });
      })
  );
});

// Handle push events (for browsers that don't use onBackgroundMessage)
self.addEventListener('push', function(event) {
  swLog('📨 Push event received');
  
  if (!event.data) {
    swLog('⚠️ Push event has no data');
    return;
  }

  try {
    var data = event.data.json();
    swLog('📦 Push data parsed', data);
    
    // This is a fallback for browsers that don't trigger onBackgroundMessage
    // Firebase Messaging usually handles this automatically
  } catch (e) {
    swError('❌ Error parsing push data', {
      name: e.name,
      message: e.message
    });
  }
});

// Log when service worker is ready
swLog('🎉 Service Worker script loaded and ready (version ' + SW_VERSION + ')');