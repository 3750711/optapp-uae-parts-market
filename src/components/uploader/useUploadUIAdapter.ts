import { useMemo } from "react";
import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";
import { extractPublicIdFromUrl, getProductImageUrl } from "@/utils/cloudinaryUtils";

type AdapterOpts = {
  max?: number;
  onChange?: (okItems: any[]) => void;
  onComplete?: (okItems: any[]) => void;
};

export function useUploadUIAdapter(opts: AdapterOpts = {}) {
  // НИЧЕГО не меняем в хуке — только используем
  const hook: any = useStagedCloudinaryUpload();

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

  // Мягкое извлечение полей из хука useStagedCloudinaryUpload
  const items = (hook.persistedItems ?? []).map((item: any) => {
    let thumbUrl = item.cloudinaryThumbUrl || item.cloudinaryUrl;
    
    // Create preview URL if it doesn't exist
    if (!thumbUrl) {
      if (item.localPreviewDataUrl) {
        // Use stored preview dataURL
        thumbUrl = item.localPreviewDataUrl;
      } else if (item.isHeic) {
        // For HEIC files without preview, use placeholder
        thumbUrl = "/placeholder-heic.svg";
      } else {
        // Fallback placeholder for any other cases
        thumbUrl = "/placeholder.svg";
      }
    }
    
    return {
      ...item,
      thumbUrl,
      // Правильное имя файла  
      originalFile: { name: item.originalName || 'Unknown' },
      // Правильный URL после загрузки 
      cloudinaryUrl: item.cloudinaryUrl,
      // Статус в правильном формате
      status: item.status === 'completed' ? 'completed' : item.status,
      // Add HEIC flag for UI handling
      isHeic: item.isHeic || false
    };
  });
  
  const uploadFiles = hook.uploadFiles;
  const removeUploadItem = hook.removeUploadItem;
  const removeStagedUrl = hook.removeStagedUrl;
  const retryItem = null; // пока не реализован в оригинальном хуке
  const attachToOrder = hook.attachToOrder;
  const initSession = hook.initSession;

  const api = useMemo(() => ({
    items,
    uploadFiles: async (files: File[]) => {
      // Инициализируем сессию для IndexedDB persistence
      if (initSession) {
        await initSession();
      }
      return uploadFiles?.(files);
    },
    removeItem: (id: string) => {
      // Remove from persistent items first
      removeUploadItem?.(id);
      // Also remove from staged URLs by matching the item
      const item = items.find(i => i.id === id);
      if (item?.cloudinaryUrl) {
        removeStagedUrl?.(item.cloudinaryUrl);
      }
    },
    retryItem: (id: string) => retryItem?.(id),
    attachToOrder,
    // Добавляем функцию для очистки всех элементов
    clearItems: () => {
      hook.clearStaging?.();
    }
  }), [items, uploadFiles, removeUploadItem, removeStagedUrl, retryItem, attachToOrder, hook, initSession]);

  return api;
}