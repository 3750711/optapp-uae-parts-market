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
    return file.name.toLowerCase().endsWith('.heic') || 
           file.name.toLowerCase().endsWith('.heif') ||
           file.type.toLowerCase().includes('heic') ||
           file.type.toLowerCase().includes('heif');
  };

  // Мягкое извлечение полей из хука useStagedCloudinaryUpload
  const items = (hook.uploadItems ?? []).map((item: any) => {
    let thumbUrl = item.thumbUrl;
    
    // Create preview URL if it doesn't exist
    if (!thumbUrl && item.file) {
      if (isHeicFile(item.file)) {
        // For HEIC files, try to generate Cloudinary preview if we have a URL
        if (item.url) {
          const publicId = extractPublicIdFromUrl(item.url);
          if (publicId) {
            thumbUrl = getProductImageUrl(publicId, 'thumbnail');
          } else {
            thumbUrl = "/placeholder-heic.svg"; // Fallback placeholder
          }
        } else {
          thumbUrl = "/placeholder-heic.svg"; // This should be a placeholder image
        }
      } else {
        // Create blob URL for regular files
        thumbUrl = URL.createObjectURL(item.file);
      }
    }
    
    return {
      ...item,
      thumbUrl,
      // Правильное имя файла  
      originalFile: { name: item.file?.name || 'Unknown' },
      // Правильный URL после загрузки 
      cloudinaryUrl: item.url,
      // Статус в правильном формате
      status: item.status === 'success' ? 'completed' : item.status,
      // Add HEIC flag for UI handling
      isHeic: item.file ? isHeicFile(item.file) : false
    };
  });
  
  const uploadFiles = hook.uploadFiles;
  const removeUploadItem = hook.removeUploadItem;
  const removeStagedUrl = hook.removeStagedUrl;
  const retryItem = null; // пока не реализован в оригинальном хуке
  const attachToOrder = hook.attachToOrder;

  const api = useMemo(() => ({
    items,
    uploadFiles: (files: File[]) => uploadFiles?.(files),
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
    // Добавляем функцию для очистки всех элементов
    clearItems: () => {
      hook.clearStaging?.();
    }
  }), [items, uploadFiles, removeUploadItem, removeStagedUrl, retryItem, attachToOrder, hook]);

  return api;
}