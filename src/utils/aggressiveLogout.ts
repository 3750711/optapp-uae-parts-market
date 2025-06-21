
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/logger';

interface LogoutOptions {
  useNuclearOption?: boolean;
  skipServerInvalidation?: boolean;
}

/**
 * Агрессивная функция очистки всех данных при выходе
 */
export const aggressiveLogout = async (options: LogoutOptions = {}) => {
  const { useNuclearOption = false, skipServerInvalidation = false } = options;
  
  try {
    devLog('🚀 Starting aggressive logout process...');
    
    // 1. Установить флаг принудительного выхода
    setLogoutFlag();
    
    // 2. Серверная инвалидация токенов (если не пропущена)
    if (!skipServerInvalidation) {
      await serverTokenInvalidation();
    }
    
    // 3. Остановить все Supabase процессы
    await stopSupabaseProcesses();
    
    // 4. Очистка клиентского хранилища
    await clearClientStorage();
    
    // 5. Очистка IndexedDB и WebSQL
    await clearDatabaseStorage();
    
    // 6. Очистка cookies
    clearAllCookies();
    
    // 7. Nuclear option если требуется
    if (useNuclearOption) {
      await nuclearCleanup();
    }
    
    devLog('✅ Aggressive logout completed successfully');
    
    // 8. Принудительная перезагрузка
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    devError('💥 Error during aggressive logout:', error);
    
    // Fallback - nuclear option
    await nuclearCleanup();
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
};

/**
 * Установить флаг принудительного выхода
 */
const setLogoutFlag = () => {
  try {
    const logoutData = {
      timestamp: Date.now(),
      forced: true,
      version: '1.0'
    };
    
    localStorage.setItem('logout_forced', JSON.stringify(logoutData));
    sessionStorage.setItem('logout_forced', JSON.stringify(logoutData));
    devLog('🏴 Logout flag set');
  } catch (error) {
    devLog('⚠️ Failed to set logout flag:', error);
  }
};

/**
 * Серверная инвалидация токенов
 */
const serverTokenInvalidation = async () => {
  try {
    devLog('🔒 Starting server token invalidation...');
    
    // Вызываем RPC функцию для инвалидации токенов на сервере
    const { error } = await supabase.rpc('force_user_logout');
    
    if (error) {
      devLog('⚠️ Server token invalidation failed:', error.message);
    } else {
      devLog('✅ Server tokens invalidated successfully');
    }
  } catch (error) {
    devLog('⚠️ Server token invalidation error:', error);
  }
};

/**
 * Остановить все Supabase процессы
 */
const stopSupabaseProcesses = async () => {
  try {
    devLog('⏹️ Stopping Supabase processes...');
    
    // Остановить автообновление токенов (если доступно)
    if (typeof (supabase.auth as any).stopAutoRefreshToken === 'function') {
      (supabase.auth as any).stopAutoRefreshToken();
      devLog('✅ Auto refresh token stopped');
    }
    
    // Попытка отписаться от всех слушателей
    try {
      const { data } = supabase.auth.onAuthStateChange(() => {});
      if (data?.subscription) {
        data.subscription.unsubscribe();
      }
    } catch (error) {
      devLog('⚠️ Failed to unsubscribe from auth listeners:', error);
    }
    
    devLog('✅ Supabase processes stopped');
  } catch (error) {
    devLog('⚠️ Failed to stop Supabase processes:', error);
  }
};

/**
 * Очистка клиентского хранилища
 */
const clearClientStorage = async () => {
  try {
    devLog('🧹 Clearing client storage...');
    
    // Очистка localStorage
    const localKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isSupabaseRelatedKey(key)) {
        localKeysToRemove.push(key);
      }
    }
    
    localKeysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        devLog(`🗑️ Removed localStorage key: ${key}`);
      } catch (error) {
        devLog(`⚠️ Failed to remove localStorage key ${key}:`, error);
      }
    });
    
    // Очистка sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isSupabaseRelatedKey(key)) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        devLog(`🗑️ Removed sessionStorage key: ${key}`);
      } catch (error) {
        devLog(`⚠️ Failed to remove sessionStorage key ${key}:`, error);
      }
    });
    
    devLog('✅ Client storage cleared');
  } catch (error) {
    devLog('⚠️ Failed to clear client storage:', error);
  }
};

/**
 * Проверка, является ли ключ связанным с Supabase
 */
const isSupabaseRelatedKey = (key: string): boolean => {
  const supabasePatterns = [
    'sb-',
    'supabase',
    'auth-token',
    'vfiylfljiixqkjfqubyq',
    'auth.token',
    'supabase.auth',
    'refresh_token',
    'access_token'
  ];
  
  return supabasePatterns.some(pattern => 
    key.toLowerCase().includes(pattern.toLowerCase())
  );
};

/**
 * Очистка IndexedDB и WebSQL
 */
const clearDatabaseStorage = async () => {
  try {
    devLog('🗄️ Clearing database storage...');
    
    // Очистка IndexedDB
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (
            db.name.includes('supabase') || 
            db.name.includes('vfiylfljiixqkjfqubyq')
          )) {
            indexedDB.deleteDatabase(db.name);
            devLog(`🗑️ Deleted IndexedDB: ${db.name}`);
          }
        }
      } catch (error) {
        devLog('⚠️ Failed to clear IndexedDB:', error);
      }
    }
    
    // Очистка WebSQL (устаревшее, но на всякий случай)
    if ('openDatabase' in window) {
      try {
        // WebSQL is deprecated, but we'll try to clear it anyway
        devLog('📦 Attempting WebSQL cleanup...');
      } catch (error) {
        devLog('⚠️ WebSQL cleanup not available:', error);
      }
    }
    
    devLog('✅ Database storage cleared');
  } catch (error) {
    devLog('⚠️ Failed to clear database storage:', error);
  }
};

/**
 * Очистка всех cookies
 */
const clearAllCookies = () => {
  try {
    devLog('🍪 Clearing cookies...');
    
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (isSupabaseRelatedKey(name)) {
        // Удаляем cookie для всех возможных путей и доменов
        const domains = [
          window.location.hostname,
          `.${window.location.hostname}`,
          'localhost',
          '.localhost'
        ];
        
        const paths = ['/', '/auth', '/login', '/register'];
        
        domains.forEach(domain => {
          paths.forEach(path => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          });
        });
        
        devLog(`🗑️ Cleared cookie: ${name}`);
      }
    });
    
    devLog('✅ Cookies cleared');
  } catch (error) {
    devLog('⚠️ Failed to clear cookies:', error);
  }
};

/**
 * Nuclear cleanup - последняя мера
 */
const nuclearCleanup = async () => {
  try {
    devLog('☢️ Initiating nuclear cleanup...');
    
    // Очистить ВСЕ localStorage и sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      devLog('💥 All storage cleared');
    } catch (error) {
      devLog('⚠️ Failed to clear all storage:', error);
    }
    
    // Очистить все cookies без исключений
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    });
    
    devLog('☢️ Nuclear cleanup completed');
  } catch (error) {
    devLog('💥 Nuclear cleanup failed:', error);
  }
};

/**
 * Проверить флаг принудительного выхода
 */
export const checkLogoutFlag = (): boolean => {
  try {
    const localFlag = localStorage.getItem('logout_forced');
    const sessionFlag = sessionStorage.getItem('logout_forced');
    
    if (localFlag || sessionFlag) {
      const flagData = JSON.parse(localFlag || sessionFlag || '{}');
      const timeDiff = Date.now() - (flagData.timestamp || 0);
      
      // Флаг действует 5 минут
      if (timeDiff < 5 * 60 * 1000) {
        devLog('🚫 Logout flag detected - blocking auto-login');
        return true;
      } else {
        // Очищаем устаревший флаг
        clearLogoutFlag();
      }
    }
    
    return false;
  } catch (error) {
    devLog('⚠️ Failed to check logout flag:', error);
    return false;
  }
};

/**
 * Очистить флаг принудительного выхода
 */
export const clearLogoutFlag = () => {
  try {
    localStorage.removeItem('logout_forced');
    sessionStorage.removeItem('logout_forced');
    devLog('🧹 Logout flag cleared');
  } catch (error) {
    devLog('⚠️ Failed to clear logout flag:', error);
  }
};
