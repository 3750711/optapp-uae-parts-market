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
  const items = hook.uploadItems ?? [];
  const uploadFiles = hook.uploadFiles;
  const removeItem = hook.removeStagedUrl; // для удаления URL
  const retryItem = null; // пока не реализован в оригинальном хуке
  const attachToOrder = hook.attachToOrder;

  const api = useMemo(() => ({
    items,
    uploadFiles: (files: File[]) => uploadFiles?.(files),
    removeItem: (id: string) => removeItem?.(id),
    retryItem: (id: string) => retryItem?.(id),
    attachToOrder,
  }), [items, uploadFiles, removeItem, retryItem, attachToOrder]);

  return api;
}