
import { useCallback } from 'react';

interface UseImageDeletionStateProps {
  onConfirmDelete: (url: string) => Promise<void>;
}

export const useImageDeletionState = ({
  onConfirmDelete
}: UseImageDeletionStateProps) => {
  // Максимально простая функция удаления без статусов
  const deleteImage = useCallback(async (url: string) => {
    console.log('🗑️ Backend deletion for:', url);
    
    try {
      await onConfirmDelete(url);
      console.log('✅ Backend deletion completed:', url);
    } catch (error) {
      console.error('❌ Backend deletion error:', error);
      throw error;
    }
  }, [onConfirmDelete]);

  return {
    deleteImage
  };
};
