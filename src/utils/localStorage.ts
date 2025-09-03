// Safe localStorage utilities to prevent JSON.parse errors

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('Failed to parse localStorage JSON:', error);
    return fallback;
  }
}

export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Failed to stringify JSON for localStorage:', error);
    return '{}';
  }
}

export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, fallback);
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return fallback;
  }
}

export function safeSetItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, safeJsonStringify(value));
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
  }
}

export function cleanupCorruptedCache(): void {
  const keysToCheck = ['counts_cache', 'statistics_cache'];
  
  keysToCheck.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        JSON.parse(item);
      } catch (error) {
        console.warn(`Cleaning up corrupted localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    }
  });
}

export function clearAllStorageData(): void {
  console.log('🧹 Clearing all localStorage and sessionStorage data');
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ All storage data cleared');
  } catch (error) {
    console.warn('⚠️ Error clearing storage data:', error);
  }
}