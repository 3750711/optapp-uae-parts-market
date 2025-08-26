// Utility for diagnosing bfcache blocking issues

// Extend global types for browser APIs
declare global {
  interface Navigator {
    standalone?: boolean;
  }
  interface Window {
    webkitRTCPeerConnection?: typeof RTCPeerConnection;
    getEventListeners?: (target: EventTarget) => { [key: string]: any[] };
  }
}

export interface BfcacheBlockingReasons {
  hasBeforeUnload: boolean;
  hasUnload: boolean;
  hasWebsockets: boolean;
  hasWebRTC: boolean;
  hasNotificationPermission: boolean;
  hasActiveRequests: boolean;
  isHttps: boolean;
  userAgent: string;
  standalone: boolean;
}

export const detectBfcacheBlockingReasons = (): BfcacheBlockingReasons => {
  const reasons: BfcacheBlockingReasons = {
    hasBeforeUnload: false,
    hasUnload: false,
    hasWebsockets: false,
    hasWebRTC: false,
    hasNotificationPermission: false,
    hasActiveRequests: false,
    isHttps: location.protocol === 'https:',
    userAgent: navigator.userAgent,
    standalone: window.matchMedia('(display-mode: standalone)').matches || 
                ('standalone' in window.navigator && window.navigator.standalone === true) ||
                false
  };

  // Check for beforeunload/unload listeners (only in Chrome DevTools)
  if (typeof window.getEventListeners !== 'undefined') {
    try {
      const events = ['beforeunload', 'unload'];
      events.forEach(event => {
        const listeners = window.getEventListeners!(window)[event] || [];
        if (event === 'beforeunload' && listeners.length > 0) {
          reasons.hasBeforeUnload = true;
        }
        if (event === 'unload' && listeners.length > 0) {
          reasons.hasUnload = true;
        }
      });
    } catch (e) {
      // getEventListeners not available outside DevTools
    }
  }

  // Check for WebSocket connections
  if (typeof WebSocket !== 'undefined') {
    reasons.hasWebsockets = true;
  }

  // Check for WebRTC connections
  if (typeof RTCPeerConnection !== 'undefined' || typeof window.webkitRTCPeerConnection !== 'undefined') {
    reasons.hasWebRTC = true;
  }

  // Check notification permission
  if ('Notification' in window && Notification.permission === 'granted') {
    reasons.hasNotificationPermission = true;
  }

  return reasons;
};

export const logBfcacheStatus = () => {
  if (!import.meta.env.DEV) return;
  
  const reasons = detectBfcacheBlockingReasons();
  
  console.group('🔍 Bfcache Status Check');
  console.log('HTTPS:', reasons.isHttps ? '✅' : '❌');
  console.log('Standalone PWA:', reasons.standalone ? '✅' : '❌');
  console.log('BeforeUnload Listeners:', reasons.hasBeforeUnload ? '❌ BLOCKING' : '✅');
  console.log('Unload Listeners:', reasons.hasUnload ? '❌ BLOCKING' : '✅');
  console.log('WebSocket:', reasons.hasWebsockets ? '⚠️ May block' : '✅');
  console.log('WebRTC:', reasons.hasWebRTC ? '⚠️ May block' : '✅');
  console.log('Notifications:', reasons.hasNotificationPermission ? '⚠️ May block' : '✅');
  console.log('User Agent:', reasons.userAgent);
  console.groupEnd();
  
  return reasons;
};

export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent;
  return isIOSDevice() && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
};

export const isTelegramWebView = (): boolean => {
  return /TelegramWebView/.test(navigator.userAgent);
};

export const shouldAvoidBeforeUnload = (): boolean => {
  return isIOSDevice() || isTelegramWebView() || 
         window.matchMedia('(display-mode: standalone)').matches;
};