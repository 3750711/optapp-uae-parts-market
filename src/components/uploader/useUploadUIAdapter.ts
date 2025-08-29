import { useMemo } from "react";
import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";

type AdapterOpts = {
  max?: number;
  onChange?: (okItems: any[]) => void;
  onComplete?: (okItems: any[]) => void;
};

export function useUploadUIAdapter(opts: AdapterOpts = {}) {
  // НИЧЕГО не меняем в хуке — только используем
  const hook: any = useStagedCloudinaryUpload();

  // Мягкое извлечение полей из хука useStagedCloudinaryUpload
  const items = (hook.uploadItems ?? []).map((item: any) => ({
    ...item,
    // Создаем превью URL если его нет
    thumbUrl: item.thumbUrl || (item.file ? URL.createObjectURL(item.file) : null),
    // Правильное имя файла
    originalFile: { name: item.file?.name || 'Unknown' },
    // Правильный URL после загрузки 
    cloudinaryUrl: item.url,
    // Статус в правильном формате
    status: item.status === 'success' ? 'completed' : item.status
  }));
  
  const uploadFiles = hook.uploadFiles;
  const removeUploadItem = hook.removeUploadItem;
  const removeStagedUrl = hook.removeStagedUrl;
  const retryItem = null; // пока не реализован в оригинальном хуке
  const attachToOrder = hook.attachToOrder;

  const api = useMemo(() => ({
    items,
    uploadFiles: (files: File[]) => {
      console.log('📸 useUploadUIAdapter: uploadFiles wrapper called', { 
        fileCount: files?.length || 0,
        files: files?.map(f => ({ name: f.name, type: f.type, size: f.size }))
      });
      return uploadFiles?.(files);
    },
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