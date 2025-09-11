import { useMemo, useCallback, useState, useEffect } from "react";
import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";
import { extractPublicIdFromUrl, getProductImageUrl } from "@/utils/cloudinaryUtils";

type AdapterOpts = {
  max?: number;
  onChange?: (okItems: any[]) => void;
  onComplete?: (okItems: any[]) => void;
  existingUrls?: string[];
};

export function useUploadUIAdapter(opts: AdapterOpts = {}) {
  const { max, onChange, onComplete, existingUrls } = opts;
  const hook = useStagedCloudinaryUpload();
  const [localUploadItems, setLocalUploadItems] = useState<any[]>([]);

  // Helper function to detect HEIC files
  const isHeicFile = (file: File): boolean => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif') ||
                   file.type.toLowerCase().includes('heic') ||
                   file.type.toLowerCase().includes('heif') ||
                   file.type === 'image/heic' || 
                   file.type === 'image/heif';
    
    if (isHeic) {
      console.log(`📱 HEIC file detected: ${file.name} (${file.type})`);
    }
    
    return isHeic;
  };

  // Create existing items from URLs
  const existingItems = useMemo(() => {
    if (!existingUrls?.length) return [];
    return existingUrls.map((url, index) => ({
      id: `existing-${index}-${url}`,
      status: "completed" as const,
      cloudinaryUrl: url,
      thumbUrl: url,
      originalFile: { name: `Existing Photo ${index + 1}` },
      progress: 100,
      isHeic: false,
    }));
  }, [existingUrls]);

  // Map uploadItems from hook with local state
  const uploadItems = useMemo(() => {
    // Merge hook items with local state
    const hookItems = (hook.uploadItems ?? []);
    
    return hookItems.map((item: any) => {
      // Find local item for progress updates
      const localItem = localUploadItems.find(li => li.id === item.id);
      
      let thumbUrl = item.thumbUrl;
      
      // Create preview URL if it doesn't exist
      if (!thumbUrl && item.file) {
        if (isHeicFile(item.file)) {
          if (item.url) {
            const publicId = extractPublicIdFromUrl(item.url);
            if (publicId) {
              thumbUrl = getProductImageUrl(publicId, 'thumbnail');
            } else {
              thumbUrl = "/placeholder-heic.svg";
            }
          } else {
            thumbUrl = "/placeholder-heic.svg";
          }
        } else {
          // Create blob URL for regular files
          thumbUrl = URL.createObjectURL(item.file);
        }
      }
      
      return {
        ...item,
        thumbUrl,
        originalFile: { name: item.file?.name || 'Unknown' },
        cloudinaryUrl: item.url,
        // Use local progress if available
        progress: localItem?.progress ?? item.progress ?? 0,
        // Map status correctly
        status: item.status === 'success' ? 'completed' : 
                item.status === 'pending' ? 'idle' : 
                item.status,
        isHeic: item.file ? isHeicFile(item.file) : false
      };
    });
  }, [hook.uploadItems, localUploadItems]);

  // Combine existing and upload items
  const items = [...existingItems, ...uploadItems];
  
  // Enhanced uploadFiles with progress tracking
  const uploadFiles = useCallback(async (files: File[]) => {
    if (!hook.uploadFiles) return;
    
    // Initialize local items for progress tracking
    const newItems = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'idle'
    }));
    
    setLocalUploadItems(prev => [...prev, ...newItems]);
    
    // Call hook's uploadFiles
    await hook.uploadFiles(files);
    
    // Clear local items after upload
    setLocalUploadItems([]);
  }, [hook.uploadFiles]);

  const removeUploadItem = hook.removeUploadItem;
  const removeStagedUrl = hook.removeStagedUrl;
  const retryItem = null; 
  const attachToOrder = hook.attachToOrder;

  // Call onChange when items change
  useEffect(() => {
    const okItems = items.filter(item => 
      item.status === 'completed' && item.cloudinaryUrl
    );
    if (onChange) {
      onChange(okItems.map(item => item.cloudinaryUrl));
    }
  }, [items, onChange]);

  // Call onComplete when all done
  useEffect(() => {
    if (items.length > 0 && 
        items.every(item => item.status === 'completed' || item.status === 'error')) {
      const okItems = items.filter(item => 
        item.status === 'completed' && item.cloudinaryUrl
      );
      if (onComplete) {
        onComplete(okItems.map(item => item.cloudinaryUrl));
      }
    }
  }, [items, onComplete]);

  const api = useMemo(() => ({
    items,
    uploadFiles,
    removeItem: (id: string) => {
      // Пробуем удаление из uploadItems по ID и из stagedUrls по URL
      removeUploadItem?.(id);
      // Для stagedUrls ищем URL в items и удаляем
      const item = items.find(i => i.id === id);
      if (item?.cloudinaryUrl) {
        removeStagedUrl?.(item.cloudinaryUrl);
      }
    },
    retryItem: (id: string) => retryItem?.(id),
    attachToOrder,
    clearItems: () => {
      hook.clearStaging?.();
      setLocalUploadItems([]);
    }
  }), [items, uploadFiles, removeUploadItem, removeStagedUrl, retryItem, attachToOrder, hook]);

  return api;
}