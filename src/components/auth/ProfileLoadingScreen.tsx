import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const ProfileLoadingScreen: React.FC = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const { refreshProfile, isProfileLoading } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        // Show refresh button after 8 seconds
        if (newTime >= 8) {
          setShowRefreshButton(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setTimeElapsed(0);
    setShowRefreshButton(false);
    await refreshProfile();
  };

  const handlePageReload = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-md mx-auto text-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow mx-auto mb-6"></div>
      
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Настройка профиля...
      </h2>
      
      <p className="text-gray-600 mb-4">
        Подождите, мы создаем ваш профиль
      </p>

      {/* Progress indicator */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-optapp-yellow h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min((timeElapsed / 10) * 100, 90)}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Время ожидания: {timeElapsed} сек
      </p>

      {showRefreshButton && (
        <div className="space-y-3">
          <p className="text-sm text-amber-600 mb-3">
            Загрузка занимает больше времени, чем обычно
          </p>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isProfileLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isProfileLoading ? 'animate-spin' : ''}`} />
              Повторить попытку
            </Button>
            
            <Button
              onClick={handlePageReload}
              variant="secondary"
              size="sm"
            >
              Перезагрузить страницу
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileLoadingScreen;