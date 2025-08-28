import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StagedUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'signing' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  publicId?: string;
}

interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
  upload_url: string;
}

// IndexedDB for storing staged URLs
const DB_NAME = 'StagedUploads';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

class StagedUploadDB {
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
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
    });
  }

  async saveSession(sessionId: string, urls: string[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        sessionId,
        urls,
        createdAt: Date.now()
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionId: string): Promise<string[] | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.urls : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(sessionId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldSessions(): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
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
}

const stagingDB = new StagedUploadDB();

export const useStagedCloudinaryUpload = () => {
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stagedUrls, setStagedUrls] = useState<string[]>([]);
  const [uploadItems, setUploadItems] = useState<StagedUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize session ID and restore from IndexedDB
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId;
    
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    
    try {
      // Try to restore previous session data
      const savedUrls = await stagingDB.getSession(newSessionId);
      if (savedUrls) {
        setStagedUrls(savedUrls);
      }
      
      // Clean up old sessions
      await stagingDB.clearOldSessions();
    } catch (error) {
      console.error('Failed to initialize staging session:', error);
    }
    
    return newSessionId;
  }, [sessionId]);

  // Get Cloudinary signature for staging
  const getSignature = useCallback(async (currentSessionId: string): Promise<CloudinarySignature> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
      body: JSON.stringify({ sessionId: currentSessionId }),
      headers: {
        'content-type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      }
    });
    
    if (error) throw new Error(error.message || 'Signature request failed');
    if (!data) throw new Error('No signature data received');
    
    const payload = data.success ? data.data : data;
    if (!payload?.signature) throw new Error('Invalid signature response');
    
    return payload;
  }, []);

  // Upload to Cloudinary
  const uploadToCloudinary = useCallback(async (
    file: File,
    signature: CloudinarySignature,
    onProgress: (progress: number) => void
  ): Promise<{ url: string; publicId: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('folder', signature.folder);
      formData.append('public_id', signature.public_id);
      formData.append('signature', signature.signature);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id
            });
          } catch (error) {
            reject(new Error('Invalid Cloudinary response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      
      xhr.open('POST', signature.upload_url);
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  }, []);

  // Upload files to staging
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const currentSessionId = await initSession();
    const newUrls: string[] = [];
    
    // Create upload items
    const items: StagedUploadItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadItems(items);

    try {
      // Upload each file
      for (const item of items) {
        try {
          // Update status to signing
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, status: 'signing', progress: 10 } : i
          ));

          const signature = await getSignature(currentSessionId);

          // Update status to uploading
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, status: 'uploading', progress: 20 } : i
          ));

          const result = await uploadToCloudinary(
            item.file,
            signature,
            (progress) => {
              setUploadItems(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: Math.max(20, progress) } : i
              ));
            }
          );

          // Update to success
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              status: 'success', 
              progress: 100,
              url: result.url,
              publicId: result.publicId
            } : i
          ));

          newUrls.push(result.url);
        } catch (error) {
          // Update to error
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { 
              ...i, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : i
          ));
          
          console.error(`Upload failed for ${item.file.name}:`, error);
        }
      }

      // Update staged URLs and save to IndexedDB
      const updatedUrls = [...stagedUrls, ...newUrls];
      setStagedUrls(updatedUrls);
      
      if (newUrls.length > 0) {
        try {
          await stagingDB.saveSession(currentSessionId, updatedUrls);
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error);
        }

        toast({
          title: "Файлы загружены",
          description: `Загружено ${newUrls.length} из ${files.length} файлов в промежуточное хранилище`,
        });
      }

      if (newUrls.length < files.length) {
        toast({
          title: "Частичная загрузка",
          description: `${files.length - newUrls.length} файлов не удалось загрузить`,
          variant: "destructive",
        });
      }

      return newUrls;
    } catch (error) {
      console.error('Staging upload failed:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
      // Clear upload items after delay
      setTimeout(() => setUploadItems([]), 5000);
    }
  }, [initSession, getSignature, uploadToCloudinary, stagedUrls, toast]);

  // Attach staged URLs to real order
  const attachToOrder = useCallback(async (orderId: string): Promise<void> => {
    if (stagedUrls.length === 0) return;

    const items = stagedUrls.map(url => ({
      url,
      type: 'photo' as const
    }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication session found');
    }

    const { data, error } = await supabase.functions.invoke('attach-order-media', {
      body: JSON.stringify({ order_id: orderId, items }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (error) throw new Error('Edge Function call failed: ' + error.message);
    if (!data?.success) throw new Error('Database save failed: ' + (data?.error || 'unknown'));

    // Clear staged data after successful attachment
    setStagedUrls([]);
    if (sessionId) {
      try {
        await stagingDB.clearSession(sessionId);
      } catch (error) {
        console.error('Failed to clear staging session:', error);
      }
    }
  }, [stagedUrls, sessionId]);

  // Remove staged URL
  const removeStagedUrl = useCallback(async (url: string) => {
    const updatedUrls = stagedUrls.filter(u => u !== url);
    setStagedUrls(updatedUrls);
    
    if (sessionId) {
      try {
        await stagingDB.saveSession(sessionId, updatedUrls);
      } catch (error) {
        console.error('Failed to update staged URLs:', error);
      }
    }
  }, [stagedUrls, sessionId]);

  // Clear all staged data
  const clearStaging = useCallback(async () => {
    setStagedUrls([]);
    setUploadItems([]);
    
    if (sessionId) {
      try {
        await stagingDB.clearSession(sessionId);
      } catch (error) {
        console.error('Failed to clear staging session:', error);
      }
    }
    
    setSessionId(null);
  }, [sessionId]);

  return {
    sessionId,
    stagedUrls,
    uploadItems,
    isUploading,
    uploadFiles,
    attachToOrder,
    removeStagedUrl,
    clearStaging,
    initSession
  };
};