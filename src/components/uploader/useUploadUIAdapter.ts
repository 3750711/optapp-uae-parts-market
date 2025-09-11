import { useCallback, useState, useMemo } from 'react';
import { UploadItem, UploadChange } from '../../features/uploads/types';
import { useStagedCloudinaryUpload } from '../../features/uploads/useStagedCloudinaryUpload';

type Props = {
  existingUrls?: string[];
  onChange?: (state: UploadChange) => void;
  onComplete?: (urls: string[]) => void;
  max?: number;
};

export function useUploadUIAdapter({
  existingUrls = [],
  onChange,
  onComplete,
  max,
}: Props) {
  const initialCompleted: UploadItem[] = useMemo(
    () =>
      existingUrls.map((url, i) => ({
        id: `existing-${i}`,
        file: null,
        previewUrl: url,
        url,
        progress: 100,
        status: 'completed' as const,
        error: null,
      })),
    [existingUrls]
  );

  const [items, setItems] = useState<UploadItem[]>(initialCompleted);
  const { uploadFiles } = useStagedCloudinaryUpload();

  const notifyChanges = useCallback((newItems: UploadItem[]) => {
    const completedUrls = newItems.filter((x) => x.status === 'completed' && x.url).map((x) => x.url!);
    const hasActive = newItems.some((x) => x.status === 'compressing' || x.status === 'uploading' || x.status === 'idle');

    onChange?.({ items: newItems, completedUrls, hasActive });

    if (!hasActive && completedUrls.length > 0) {
      onComplete?.(completedUrls);
    }
  }, [onChange, onComplete]);

  const patchItem = useCallback((patch: Partial<UploadItem> & { id: string }) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === patch.id ? { ...it, ...patch } : it));
      notifyChanges(next);
      return next;
    });
  }, [notifyChanges]);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      const freeSlots = typeof max === 'number' ? Math.max(0, max - items.length) : files.length;
      const toUpload = files.slice(0, freeSlots);

      const tempItems: UploadItem[] = toUpload.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        progress: 0,
        status: 'idle' as const,
      }));
      
      setItems((prev) => {
        const next = [...prev, ...tempItems];
        notifyChanges(next);
        return next;
      });

      await uploadFiles(toUpload, patchItem);
    },
    [items.length, max, patchItem, uploadFiles, notifyChanges]
  );

  const removeById = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      notifyChanges(next);
      return next;
    });
  }, [notifyChanges]);

  return {
    items,
    addFiles,
    removeById,
  };
}