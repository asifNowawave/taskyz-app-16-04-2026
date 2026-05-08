/**
 * Cross-Browser Notification Helper
 * Handles notification permission and compatibility across different browsers
 */

(function(window) {
  'use strict';

  // Browser detection
  function detectBrowser() {
    var ua = navigator.userAgent.toLowerCase();
    
    // Check for Brave first (before Chrome)
    if (navigator.brave && navigator.brave.isBrave) return 'brave';
    if (ua.indexOf('brave') > -1) return 'brave';
    
    if (ua.indexOf('firefox') > -1) return 'firefox';
    if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) return 'safari';
    if (ua.indexOf('edg') > -1) return 'edge';
    if (ua.indexOf('opr') > -1 || ua.indexOf('opera') > -1) return 'opera';
    if (ua.indexOf('chrome') > -1) return 'chrome';
    
    return 'unknown';
  }

  // Enhanced logging for Brave
  function log(message, data) {
    var browser = detectBrowser();
    var timestamp = new Date().toLocaleTimeString();
    var fullMessage = '[' + timestamp + '] [NotificationHelper] ' + message;
    
    console.log(fullMessage, data || '');
    
    // For Brave, use multiple console methods
    if (browser === 'brave') {
      console.info('🔵 BRAVE: ' + fullMessage, data || '');
      console.warn('🟡 BRAVE: ' + fullMessage, data || '');
    }
  }

  function error(message, data) {
    var browser = detectBrowser();
    var timestamp = new Date().toLocaleTimeString();
    var fullMessage = '[' + timestamp + '] [NotificationHelper] ' + message;
    
    console.error(fullMessage, data || '');
    
    // For Brave, also use warn
    if (browser === 'brave') {
      console.warn('🔴 BRAVE ERROR: ' + fullMessage, data || '');
    }
  }

  // Check if notifications are supported
  function isNotificationSupported() {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }

  // Get current permission status
  function getPermissionStatus() {
    if (!isNotificationSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  // Request notification permission with browser-specific handling
  function requestPermission() {
    return new Promise(function(resolve, reject) {
      if (!isNotificationSupported()) {
        error('Notifications not supported in this browser');
        reject(new Error('Notifications not supported in this browser'));
        return;
      }

      var browser = detectBrowser();
      log('🔔 Requesting notification permission for: ' + browser);

      // Check current permission
      if (Notification.permission === 'granted') {
        log('✅ Permission already granted');
        resolve('granted');
        return;
      }

      if (Notification.permission === 'denied') {
        log('❌ Permission previously denied');
        error('Notification permission denied. Please enable in browser settings.');
        reject(new Error('Notification permission denied. Please enable in browser settings.'));
        return;
      }

      // Request permission
      log('📋 Requesting permission...');
      Notification.requestPermission().then(function(permission) {
        log('📋 Permission result: ' + permission);
        
        if (permission === 'granted') {
          log('✅ Permission granted!');
          resolve(permission);
        } else if (permission === 'denied') {
          log('❌ Permission denied');
          error('Notification permission denied');
          reject(new Error('Notification permission denied'));
        } else {
          log('⚠️ Permission dismissed');
          error('Notification permission dismissed');
          reject(new Error('Notification permission dismissed'));
        }
      }).catch(function(err) {
        error('❌ Error requesting permission: ' + err.message);
        reject(err);
      });
    });
  }

  // Show a test notification
  function showTestNotification() {
    return new Promise(function(resolve, reject) {
      if (Notification.permission !== 'granted') {
        error('Permission not granted');
        reject(new Error('Permission not granted'));
        return;
      }

      try {
        log('📤 Showing test notification...');
        
        var notification = new Notification('Taskyz Test', {
          body: 'Notifications are working! 🎉',
          icon: '/icons/Icon-192.png',
          badge: '/icons/Icon-192.png',
          tag: 'test-notification',
          requireInteraction: false
        });

        notification.onclick = function() {
          log('✅ Test notification clicked');
          window.focus();
          notification.close();
        };

        notification.onerror = function(err) {
          error('Test notification error: ' + err);
          reject(err);
        };

        log('✅ Test notification shown successfully');
        setTimeout(function() {
          resolve(notification);
        }, 100);

      } catch (err) {
        error('Error showing test notification: ' + err.message);
        reject(err);
      }
    });
  }

  // Get browser-specific instructions for enabling notifications
  function getEnableInstructions() {
    var browser = detectBrowser();
    var instructions = {
      chrome: 'Click the lock icon in the address bar → Site settings → Notifications → Allow',
      firefox: 'Click the lock icon in the address bar → Permissions → Notifications → Allow',
      safari: 'Safari → Settings → Websites → Notifications → Allow for this site',
      edge: 'Click the lock icon in the address bar → Site permissions → Notifications → Allow',
      brave: 'Click the Brave icon in the address bar → Site settings → Notifications → Allow',
      opera: 'Click the lock icon in the address bar → Site settings → Notifications → Allow',
      unknown: 'Check your browser settings to enable notifications for this site'
    };

    return instructions[browser] || instructions.unknown;
  }

  // Export helper functions
  window.NotificationHelper = {
    detectBrowser: detectBrowser,
    isSupported: isNotificationSupported,
    getPermission: getPermissionStatus,
    requestPermission: requestPermission,
    showTest: showTestNotification,
    getInstructions: getEnableInstructions,
    log: log,
    error: error
  };

  var browser = detectBrowser();
  log('✅ Notification Helper loaded');
  log('   Browser: ' + browser);
  log('   Supported: ' + isNotificationSupported());
  log('   Permission: ' + getPermissionStatus());
  
  if (browser === 'brave') {
    log('🔵 BRAVE BROWSER DETECTED');
    log('💡 Enhanced logging enabled for Brave');
    log('💡 Check Console, Info, and Warnings tabs for all logs');
  }

})(window);
