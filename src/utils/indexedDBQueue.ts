// IndexedDB utilities for persistent upload queue management
// Enables pause/resume functionality across browser sessions

interface QueueItem {
  id: string;
  orderId: string;
  file: File;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error' | 'paused' | 'deleted';
  progress: number;
  error?: string;
  originalSize: number;
  compressedSize?: number;
  finalUrl?: string;
  publicId?: string;
  createdAt: number;
  updatedAt: number;
}

interface QueueMetadata {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  lastUpdated: number;
}

const DB_NAME = 'cloudinary_upload_queue';
const DB_VERSION = 1;
const STORE_NAME = 'upload_items';
const METADATA_STORE = 'queue_metadata';

class IndexedDBQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('📦 IndexedDB queue initialized');
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create upload items store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('orderId', 'orderId');
          store.createIndex('createdAt', 'createdAt');
        }
        
        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        }
      };
    });
    
    return this.initPromise;
  }

  async addItem(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const queueItem: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queueItem);
      
      request.onsuccess = () => {
        console.log(`📥 Added item to queue: ${queueItem.id}`);
        resolve(queueItem.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(id: string, updates: Partial<QueueItem>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error(`Item ${id} not found`));
          return;
        }
        
        const updatedItem = { 
          ...item, 
          ...updates, 
          updatedAt: Date.now() 
        };
        
        const putRequest = store.put(updatedItem);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getAllItems(): Promise<QueueItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getItemsByStatus(status: QueueItem['status']): Promise<QueueItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(status);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log(`🗑️ Deleted item from queue: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCompleted(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const completedItems = await this.getItemsByStatus('success');
    const deletedItems = await this.getItemsByStatus('deleted');
    
    const itemsToDelete = [...completedItems, ...deletedItems];
    
    for (const item of itemsToDelete) {
      await this.deleteItem(item.id);
    }
    
    console.log(`🧹 Cleared ${itemsToDelete.length} completed items from queue`);
  }

  async updateMetadata(metadata: Partial<QueueMetadata>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const metadataItem = {
      id: 'global',
      ...metadata,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put(metadataItem);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(): Promise<QueueMetadata | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get('global');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, ...metadata } = result;
          resolve(metadata as QueueMetadata);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
const indexedDBQueue = new IndexedDBQueue();

export { indexedDBQueue, type QueueItem, type QueueMetadata };