// Simple version management for critical updates
const CURRENT_VERSION = '3.7.1-cloudinary-fix';
const VERSION_KEY = 'pb_app_version';

export function checkAppVersion(): void {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  
  // First run - just save version
  if (!savedVersion) {
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    console.log('📱 App version set:', CURRENT_VERSION);
    return;
  }
  
  // Version changed - need update
  if (savedVersion !== CURRENT_VERSION) {
    console.log('🔄 New version detected:', CURRENT_VERSION, 'was:', savedVersion);
    
    // ✅ Агрессивная очистка для Cloudinary SDK
    try {
      // Очистить sessionStorage (может содержать старые данные виджета)
      if ('sessionStorage' in window) {
        sessionStorage.clear();
        console.log('🗑️ SessionStorage cleared');
      }
      
      // Очистить специфичные ключи localStorage для Cloudinary
      const cloudinaryKeys = Object.keys(localStorage).filter(key => 
        key.includes('cloudinary') || 
        key.includes('cld-') ||
        key.includes('upload-widget')
      );
      cloudinaryKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Cleared Cloudinary key:', key);
      });
    } catch (e) {
      console.warn('⚠️ Storage cleanup error:', e);
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          console.log('🗑️ Clearing cache:', name);
          caches.delete(name);
        });
      });
    }
    
    // Update service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
    
    // Save new version
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    
    // Reload page after short delay
    setTimeout(() => {
      console.log('♻️ Reloading for version update...');
      window.location.reload();
    }, 500);
  }
}

// Optional: Get current version
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}