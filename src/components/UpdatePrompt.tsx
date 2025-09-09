import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCw } from 'lucide-react';

export const UpdatePrompt: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showChunkErrorPrompt, setShowChunkErrorPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for SW update events
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    // Listen for recoverable chunk errors
    const handleChunkError = () => {
      setShowChunkErrorPrompt(true);
    };

    // Listen for successful controller update
    const handleControllerUpdated = () => {
      setIsUpdating(false);
      setShowUpdatePrompt(false);
      setShowChunkErrorPrompt(false);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('app:recoverable-chunk-error', handleChunkError);
    window.addEventListener('sw-controller-updated', handleControllerUpdated);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('app:recoverable-chunk-error', handleChunkError);
      window.removeEventListener('sw-controller-updated', handleControllerUpdated);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Soft update - just reload without aggressive cache clearing
      
      window.location.reload();
    } catch (error) {
      console.error('Failed to update:', error);
      setIsUpdating(false);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setShowChunkErrorPrompt(false);
  };

  if (!showUpdatePrompt && !showChunkErrorPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-card border shadow-lg rounded-lg p-4 z-50 max-w-sm w-full mx-4">
      <div className="flex items-start gap-3">
        {showChunkErrorPrompt ? (
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <RotateCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-1">
            {showChunkErrorPrompt ? 'Требуется обновление' : 'Доступно обновление'}
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {showChunkErrorPrompt 
              ? 'Возникла ошибка загрузки. Обновите приложение для продолжения работы'
              : 'Новая версия приложения готова к установке'
            }
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? 'Обновляем...' : 'Обновить'}
            </Button>
            
            {!showChunkErrorPrompt && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDismiss}
                disabled={isUpdating}
              >
                Позже
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};