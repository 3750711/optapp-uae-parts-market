
import { useState, useCallback, useRef, useEffect } from 'react';

interface DeletionItem {
  url: string;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

interface UseImageDeletionStateProps {
  onConfirmDelete: (url: string) => Promise<void>;
  deletionDelay?: number; // время для отмены удаления в миллисекундах
  statusDisplayTime?: number; // время показа статуса "Удалено"
}

export const useImageDeletionState = ({
  onConfirmDelete,
  deletionDelay = 3000, // 3 секунды для отмены
  statusDisplayTime = 5000 // 5 секунд показ статуса
}: UseImageDeletionStateProps) => {
  const [pendingDeletions, setPendingDeletions] = useState<Map<string, DeletionItem>>(new Map());
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set());
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  // Функция для начала процесса удаления
  const startDeletion = useCallback((url: string) => {
    // Устанавливаем статус "удаляется"
    setDeletingImages(prev => new Set(prev).add(url));

    // Создаем таймер для автоматического подтверждения удаления
    const timeoutId = setTimeout(async () => {
      try {
        await onConfirmDelete(url);
        
        // Убираем из "удаляется" и добавляем в "удалено"
        setDeletingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        
        setDeletedImages(prev => new Set(prev).add(url));
        
        // Убираем из ожидающих удаления
        setPendingDeletions(prev => {
          const newMap = new Map(prev);
          newMap.delete(url);
          return newMap;
        });

        // Через statusDisplayTime убираем статус "удалено"
        setTimeout(() => {
          setDeletedImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(url);
            return newSet;
          });
        }, statusDisplayTime);
      } catch (error) {
        console.error('Error deleting image:', error);
        // В случае ошибки убираем все статусы
        setDeletingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        setPendingDeletions(prev => {
          const newMap = new Map(prev);
          newMap.delete(url);
          return newMap;
        });
      }
    }, deletionDelay);

    // Добавляем в ожидающие удаления
    const deletionItem: DeletionItem = {
      url,
      timestamp: Date.now(),
      timeoutId
    };

    setPendingDeletions(prev => new Map(prev).set(url, deletionItem));
  }, [onConfirmDelete, deletionDelay, statusDisplayTime]);

  // Функция отмены удаления
  const cancelDeletion = useCallback((url: string) => {
    const pendingItem = pendingDeletions.get(url);
    if (pendingItem) {
      clearTimeout(pendingItem.timeoutId);
      setPendingDeletions(prev => {
        const newMap = new Map(prev);
        newMap.delete(url);
        return newMap;
      });
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [pendingDeletions]);

  // Получить статус изображения
  const getImageStatus = useCallback((url: string) => {
    if (deletedImages.has(url)) return 'deleted';
    if (deletingImages.has(url)) return 'deleting';
    if (pendingDeletions.has(url)) return 'pending-deletion';
    return 'normal';
  }, [deletedImages, deletingImages, pendingDeletions]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      pendingDeletions.forEach(item => {
        clearTimeout(item.timeoutId);
      });
    };
  }, [pendingDeletions]);

  return {
    startDeletion,
    cancelDeletion,
    getImageStatus,
    pendingDeletions
  };
};
