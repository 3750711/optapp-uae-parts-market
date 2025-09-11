import { useMemo, useState, useCallback } from 'react';
import { UploadItem } from '@/features/uploads/types';

export function useConfirmationUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);

  const confirmedUrls = useMemo(
    () => items.filter((x) => x.status === 'completed' && x.url).map((x) => x.url!),
    [items]
  );

  // вызывается на любой апдейт uploader-а
  const handleChange = useCallback((next: UploadItem[]) => {
    setItems(next);
  }, []);

  // когда все активные завершены
  const handleComplete = useCallback((urls: string[]) => {
    // уже пришли итоговые урлы — можно делать side-effect (напр., в form state)
    // но состояние items уже синхронизировано через handleChange
    // здесь ничего не трогаем, просто оставляем хук чистым
  }, []);

  return {
    items,
    confirmedUrls,
    handleChange,
    handleComplete,
  };
}