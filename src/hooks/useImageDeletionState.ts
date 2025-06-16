
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseImageDeletionStateProps {
  onConfirmDelete: (url: string) => Promise<void>;
  deletionDelay?: number;
}

export const useImageDeletionState = ({
  onConfirmDelete,
  deletionDelay = 3000
}: UseImageDeletionStateProps) => {
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  // Функция для начала процесса удаления
  const startDeletion = useCallback(async (url: string) => {
    console.log('🗑️ Starting immediate deletion for:', url);
    
    // Устанавливаем статус "удаляется"
    setDeletingImages(prev => new Set(prev).add(url));

    try {
      // Сразу выполняем удаление
      await onConfirmDelete(url);
      console.log('✅ Image deletion completed:', url);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
    } finally {
      // Убираем статус "удаляется"
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [onConfirmDelete]);

  // Получить статус изображения
  const getImageStatus = useCallback((url: string) => {
    if (deletingImages.has(url)) return 'deleting';
    return 'normal';
  }, [deletingImages]);

  return {
    startDeletion,
    getImageStatus,
    cancelDeletion: () => {}, // Заглушка для совместимости
    clearImageStatus: () => {} // Заглушка для совместимости
  };
};
