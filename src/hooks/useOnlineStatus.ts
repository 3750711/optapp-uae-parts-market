import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🌐 Соединение восстановлено",
        description: "Теперь вы можете загружать фотографии",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "📡 Нет подключения к интернету",
        description: "Проверьте Wi-Fi или мобильный интернет",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
