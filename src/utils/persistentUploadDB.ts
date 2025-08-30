// Enhanced IndexedDB for persistent upload items

import { PersistedUploadItem, PersistedUploadSession } from '@/types/uploadTypes';

const DB_NAME = 'PersistentUploads';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export class PersistentUploadDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionKey' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
    });
  }

  async saveSession(sessionKey: string, items: PersistedUploadItem[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const session: PersistedUploadSession = {
        sessionKey,
        items,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionKey: string): Promise<PersistedUploadSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionKey);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(sessionKey: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(sessionKey);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async compactOldSessions(maxAgeHours = 24): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Migration from old URL-only format
  async migrateFromLegacyUrls(legacySessionId: string, urls: string[]): Promise<PersistedUploadItem[]> {
    if (urls.length === 0) return [];
    
    const now = Date.now();
    return urls.map((url, index) => ({
      id: `migrated_${legacySessionId}_${index}`,
      publicId: `migrated_${Date.now()}_${index}`,
      status: 'completed' as const,
      progress: 100,
      cloudinaryUrl: url,
      cloudinaryThumbUrl: url, // Use same URL for now
      originalName: `Migrated Image ${index + 1}`,
      createdAt: now,
      updatedAt: now
    }));
  }
}

export const persistentUploadDB = new PersistentUploadDB();