// Offline upload queue for handling network interruptions
import { toast } from '@/hooks/use-toast';
import { uploadWithSimpleRetry, UploadOptions } from './uploadWithSimpleRetry';

interface QueueItem {
  id: string;
  file: File;
  options: UploadOptions;
  timestamp: number;
}

interface QueueMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  timestamp: number;
  options: UploadOptions;
}

class OfflineUploadQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private callbacks = new Map<string, (success: boolean, url?: string, error?: string) => void>();
  
  constructor() {
    // Restore queue metadata from localStorage
    this.restoreQueue();
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('🌐 Network restored, processing offline queue');
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Network lost, uploads will be queued');
    });
  }
  
  add(
    file: File, 
    options: UploadOptions,
    callback?: (success: boolean, url?: string, error?: string) => void
  ): string {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const item: QueueItem = {
      id,
      file,
      options,
      timestamp: Date.now()
    };
    
    this.queue.push(item);
    
    if (callback) {
      this.callbacks.set(id, callback);
    }
    
    this.saveQueueMetadata();
    
    console.log('📥 Added to offline queue:', {
      id,
      fileName: file.name,
      queueLength: this.queue.length
    });
    
    toast({
      title: "Добавлено в очередь",
      description: `${file.name} будет загружен при восстановлении соединения`,
    });
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return id;
  }
  
  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0 || this.processing) {
      return;
    }
    
    this.processing = true;
    
    console.log('🔄 Processing offline upload queue:', {
      itemsCount: this.queue.length
    });
    
    toast({
      title: "Соединение восстановлено",
      description: `Загружаем ${this.queue.length} файлов из очереди`,
    });
    
    const processedItems: string[] = [];
    
    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue.shift();
      if (!item) break;
      
      try {
        console.log('📤 Processing queued upload:', item.id);
        
        const result = await uploadWithSimpleRetry(item.file, item.options);
        
        if (result.success && result.url) {
          console.log('✅ Queued upload successful:', item.id);
          
          // Call callback if exists
          const callback = this.callbacks.get(item.id);
          if (callback) {
            callback(true, result.url);
            this.callbacks.delete(item.id);
          }
          
          processedItems.push(item.id);
        } else {
          console.error('❌ Queued upload failed:', item.id, result.error);
          
          // Put back in queue for retry
          this.queue.unshift(item);
          
          // Call callback with error
          const callback = this.callbacks.get(item.id);
          if (callback) {
            callback(false, undefined, result.error);
          }
          
          break; // Stop processing on failure
        }
      } catch (error) {
        console.error('❌ Error processing queued upload:', item.id, error);
        
        // Put back in queue
        this.queue.unshift(item);
        
        // Call callback with error
        const callback = this.callbacks.get(item.id);
        if (callback) {
          callback(false, undefined, error instanceof Error ? error.message : 'Unknown error');
        }
        
        break;
      }
    }
    
    this.saveQueueMetadata();
    this.processing = false;
    
    if (processedItems.length > 0) {
      toast({
        title: "Загрузка завершена",
        description: `Успешно загружено ${processedItems.length} файлов из очереди`,
      });
    }
  }
  
  private saveQueueMetadata() {
    // Save only metadata, not the actual files
    const metadata: QueueMetadata[] = this.queue.map(item => ({
      id: item.id,
      fileName: item.file.name,
      fileSize: item.file.size,
      timestamp: item.timestamp,
      options: item.options
    }));
    
    localStorage.setItem('offline_upload_queue', JSON.stringify(metadata));
  }
  
  private restoreQueue() {
    try {
      const saved = localStorage.getItem('offline_upload_queue');
      if (saved) {
        const metadata: QueueMetadata[] = JSON.parse(saved);
        
        if (metadata.length > 0) {
          // Show notification about pending uploads
          // Note: Files cannot be restored from localStorage, only metadata
          console.log('📋 Found offline queue metadata:', metadata.length, 'items');
          
          toast({
            title: "Незавершенные загрузки",
            description: `Найдено ${metadata.length} файлов в очереди (требуется повторная загрузка)`,
          });
          
          // Clear the metadata since we can't restore files
          this.clearQueue();
        }
      }
    } catch (error) {
      console.error('Error restoring offline queue:', error);
      this.clearQueue();
    }
  }
  
  clearQueue() {
    this.queue = [];
    this.callbacks.clear();
    localStorage.removeItem('offline_upload_queue');
    
    toast({
      title: "Очередь очищена",
      description: "Все незавершенные загрузки удалены",
    });
  }
  
  getQueueStatus() {
    return {
      length: this.queue.length,
      processing: this.processing,
      items: this.queue.map(item => ({
        id: item.id,
        fileName: item.file.name,
        timestamp: item.timestamp
      }))
    };
  }
}

// Export singleton instance
export const offlineQueue = new OfflineUploadQueue();