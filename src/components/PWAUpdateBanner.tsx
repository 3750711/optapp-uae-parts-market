import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export const PWAUpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for SW update events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    // Handle controller updated event (no forced reload)
    const handleControllerUpdated = () => {
      setIsUpdating(false);
      setUpdateAvailable(false);
      console.log('🚀 PWA: Service Worker updated without reload');
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-controller-updated', handleControllerUpdated);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-controller-updated', handleControllerUpdated);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to update SW:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 max-w-sm w-full mx-4">
      <div className="text-sm font-medium mb-2">
        Доступно обновление
      </div>
      <div className="text-xs mb-3 opacity-90">
        Новая версия приложения готова к установке
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Обновляем...' : 'Обновить'}
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleDismiss}
          disabled={isUpdating}
        >
          Позже
        </Button>
      </div>
    </div>
  );
};