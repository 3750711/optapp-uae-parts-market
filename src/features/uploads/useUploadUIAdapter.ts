import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadItem, UploadChange } from './types';
import { useStagedCloudinaryUpload } from './useStagedCloudinaryUpload';

type Props = {
  existingUrls?: string[];                    // уже сохранённые фото
  onChange?: (state: UploadChange) => void;   // любой апдейт
  onComplete?: (urls: string[]) => void;      // когда активных больше нет
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
  const queueRef = useRef<Set<string>>(new Set());

  const emit = useCallback(
    (next: UploadItem[]) => {
      const completedUrls = next.filter((x) => x.status === 'completed' && x.url).map((x) => x.url!);
      const hasActive = next.some((x) => x.status === 'compressing' || x.status === 'uploading' || x.status === 'idle');

      onChange?.({ items: next, completedUrls, hasActive });

      if (!hasActive) onComplete?.(completedUrls);
    },
    [onChange, onComplete]
  );

  const patchItem = useCallback((patch: Partial<UploadItem> & { id: string }) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === patch.id ? { ...it, ...patch } : it));
      emit(next);
      return next;
    });
  }, [emit]);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      // лимит
      const freeSlots = typeof max === 'number' ? Math.max(0, max - items.length) : files.length;
      const toUpload = files.slice(0, freeSlots);

      // предварительно добавим «idle» карточки
      const tempItems: UploadItem[] = toUpload.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        progress: 0,
        status: 'idle' as const,
      }));
      
      setItems((prev) => {
        const next = [...prev, ...tempItems];
        emit(next);
        return next;
      });

      // карта старых id -> новых, чтобы синхронизировать коллбеки
      const tempIds = new Set(tempItems.map((t) => t.id));
      queueRef.current = tempIds;

      await uploadFiles(
        tempItems.map((t) => t.file!) as File[],
        (p) => {
          patchItem(p);
        }
      );

      queueRef.current.clear();
    },
    [emit, items.length, max, patchItem, uploadFiles]
  );

  const removeById = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      emit(next);
      return next;
    });
  }, [emit]);

  return {
    items,
    addFiles,
    removeById,
  };
}