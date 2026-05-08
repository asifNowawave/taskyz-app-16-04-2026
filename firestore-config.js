/**
 * Firestore Configuration for Safari Compatibility
 * 
 * Safari has CORS issues with Firestore's long-polling (XMLHttpRequest).
 * This script forces Firestore to use WebSocket instead.
 */

(function() {
    'use strict';
    
    console.log('[Firestore Config] Initializing Safari-compatible settings...');
    
    // Detect browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.indexOf('safari') !== -1 && 
                     userAgent.indexOf('chrome') === -1 &&
                     userAgent.indexOf('chromium') === -1;
    
    if (isSafari) {
        console.log('[Firestore Config] 🍎 Safari detected - applying WebSocket configuration');
        
        // Set Firestore to prefer WebSocket over long-polling
        // This prevents CORS errors in Safari
        window.FIRESTORE_PREFER_WEBSOCKET = true;
        
        console.log('[Firestore Config] ✅ WebSocket preference set for Safari');
    } else {
        console.log('[Firestore Config] Browser:', userAgent.indexOf('chrome') !== -1 ? 'Chrome' : 'Other');
        console.log('[Firestore Config] Using default Firestore connection');
    }
    
    // Listen for Firestore errors
    window.addEventListener('error', function(event) {
        if (event.message && event.message.includes('firestore')) {
            console.error('[Firestore Config] ❌ Firestore error detected:', event.message);
            
            if (event.message.includes('CORS') || event.message.includes('access control')) {
                console.error('[Firestore Config] 🚨 CORS error - WebSocket fallback should activate');
            }
        }
    }, true);
    
    console.log('[Firestore Config] Configuration complete');
})();
