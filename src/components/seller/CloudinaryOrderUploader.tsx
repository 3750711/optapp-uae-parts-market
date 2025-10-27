import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { CloudinaryPhotoUploader } from '@/components/uploader/CloudinaryPhotoUploader';
import { Lang } from '@/types/i18n';

interface CloudinaryOrderUploaderProps {
  max?: number;
  onChange?: (urls: string[]) => void;
  onComplete?: (urls: string[]) => void;
  buttonText?: string;
  language?: Lang;
  disabled?: boolean;
}

/**
 * Адаптер CloudinaryPhotoUploader для страницы создания заказа продавцом
 * Обеспечивает совместимость API с SimplePhotoUploader
 */
export const CloudinaryOrderUploader = React.memo<CloudinaryOrderUploaderProps>(({
  max = 50,
  onChange,
  onComplete,
  buttonText,
  language = 'ru',
  disabled = false
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 🔍 Диагностика: Логируем монтирование компонента
  useEffect(() => {
    console.log('🚀 [CloudinaryOrderUploader] Component mounted', {
      max,
      disabled,
      initialUrls: imageUrls.length
    });
    
    return () => {
      console.log('🔚 [CloudinaryOrderUploader] Component unmounted');
    };
  }, []);
  
  // Мемоизированный обработчик загрузки с дедупликацией
  const handleImageUpload = useCallback((newUrls: string[]) => {
    try {
      console.log('🎯 [CloudinaryOrderUploader] Upload started', {
        receivedUrls: newUrls.length
      });
      
      setUploadError(null);
      
      setImageUrls(prev => {
        // Дедупликация - добавляем только новые URL
        const filtered = newUrls.filter(url => !prev.includes(url));
        if (filtered.length === 0) {
          console.log('⚠️ [CloudinaryOrderUploader] No new URLs (duplicates)', {
            received: newUrls.length,
            existing: prev.length
          });
          return prev;
        }
        
        const updated = [...prev, ...filtered];
        console.log('✅ [CloudinaryOrderUploader] Images updated', {
          previous: prev.length,
          new: filtered.length,
          total: updated.length,
          urls: updated
        });
        
        onChange?.(updated);
        return updated;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      setUploadError(message);
      console.error('❌ [CloudinaryOrderUploader] Upload error:', message, error);
    }
  }, [onChange]); // ✅ FIX: Убрали imageUrls.length, используем функциональный update
  
  // Мемоизированный обработчик удаления
  const handleImageDelete = useCallback((urlToDelete: string) => {
    setImageUrls(prev => {
      const updated = prev.filter(url => url !== urlToDelete);
      console.log('🗑️ CloudinaryOrderUploader: Image deleted', {
        previous: prev.length,
        after: updated.length
      });
      
      onChange?.(updated);
      return updated;
    });
  }, [onChange]);
  
  // Вызываем onComplete когда загрузка завершена
  useEffect(() => {
    if (imageUrls.length > 0) {
      onComplete?.(imageUrls);
    }
  }, [imageUrls, onComplete]);
  
  // Мемоизированные props для предотвращения ре-рендеров
  const uploaderProps = useMemo(() => ({
    images: imageUrls,
    onImageUpload: handleImageUpload,
    onImageDelete: handleImageDelete,
    maxImages: max,
    disabled
  }), [imageUrls, handleImageUpload, handleImageDelete, max, disabled]);
  
  return (
    <>
      <CloudinaryPhotoUploader {...uploaderProps} />
      {uploadError && (
        <div className="mt-2 text-sm text-destructive">
          ⚠️ Ошибка: {uploadError}
        </div>
      )}
    </>
  );
});

CloudinaryOrderUploader.displayName = 'CloudinaryOrderUploader';
