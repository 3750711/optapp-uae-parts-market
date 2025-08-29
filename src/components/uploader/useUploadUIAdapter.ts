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
    uploadFiles: (files: File[]) => uploadFiles?.(files),
    removeItem: (id: string) => {
      // Пробуем оба метода удаления
      removeUploadItem?.(id);
      removeStagedUrl?.(id);
    },
    retryItem: (id: string) => retryItem?.(id),
    attachToOrder,
  }), [items, uploadFiles, removeUploadItem, removeStagedUrl, retryItem, attachToOrder]);

  return api;
}