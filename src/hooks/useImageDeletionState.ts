
import { useCallback } from 'react';

interface UseImageDeletionStateProps {
  onConfirmDelete: (url: string) => Promise<void>;
}

export const useImageDeletionState = ({
  onConfirmDelete
}: UseImageDeletionStateProps) => {
  // Простая функция удаления без статусов
  const startDeletion = useCallback(async (url: string) => {
    console.log('🗑️ Starting deletion for:', url);
    
    try {
      await onConfirmDelete(url);
      console.log('✅ Image deletion completed:', url);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error; // Пробрасываем ошибку наверх
    }
  }, [onConfirmDelete]);

  return {
    startDeletion
  };
};
