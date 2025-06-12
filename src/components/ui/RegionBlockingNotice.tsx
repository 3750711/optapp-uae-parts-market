
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, Globe } from 'lucide-react';
import SupabaseRegionDetector, { RegionInfo } from '@/utils/supabaseRegionDetector';

const RegionBlockingNotice: React.FC = () => {
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'blocked' | 'proxy'>('checking');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const detector = SupabaseRegionDetector.getInstance();
    
    const checkRegion = async () => {
      try {
        const info = await detector.detectRegion();
        setRegionInfo(info);
        setConnectionStatus(detector.getConnectionStatus());
        
        // Показываем уведомление только если есть блокировка
        if (info.isBlocked) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to detect region:', error);
        setConnectionStatus('blocked');
        setIsVisible(true);
      }
    };

    checkRegion();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('region_notice_dismissed', Date.now().toString());
  };

  const handleRetry = async () => {
    setConnectionStatus('checking');
    const detector = SupabaseRegionDetector.getInstance();
    
    try {
      const info = await detector.detectRegion();
      setRegionInfo(info);
      setConnectionStatus(detector.getConnectionStatus());
      
      if (!info.isBlocked) {
        setIsVisible(false);
      }
    } catch (error) {
      setConnectionStatus('blocked');
    }
  };

  // Не показываем, если уведомление было закрыто недавно (в течение часа)
  useEffect(() => {
    const dismissed = localStorage.getItem('region_notice_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 3600000) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <Wifi className="h-4 w-4 animate-pulse" />;
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'proxy':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'blocked':
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Проверяем подключение...';
      case 'connected':
        return 'Подключение восстановлено';
      case 'proxy':
        return 'Используется прокси-подключение';
      case 'blocked':
      default:
        return 'Обнаружена блокировка сервисов';
    }
  };

  const getInstructions = () => {
    if (connectionStatus === 'blocked') {
      return (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            Для полноценной работы сайта рекомендуем:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Использовать VPN с серверами в ЕС или США</li>
            <li>Попробовать мобильный интернет</li>
            <li>Обновить страницу через несколько минут</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert variant={connectionStatus === 'blocked' ? 'destructive' : 'default'} className="shadow-lg">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <AlertTriangle className="h-4 w-4" />
        </div>
        <AlertTitle className="flex items-center justify-between">
          {getStatusMessage()}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-auto p-1 hover:bg-transparent"
          >
            ×
          </Button>
        </AlertTitle>
        <AlertDescription>
          {regionInfo?.country === 'RU' && (
            <p className="mb-2">
              Обнаружен российский регион. Некоторые функции могут работать ограниченно.
            </p>
          )}
          
          {getInstructions()}
          
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={connectionStatus === 'checking'}
            >
              {connectionStatus === 'checking' ? 'Проверяем...' : 'Повторить'}
            </Button>
            {connectionStatus === 'blocked' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://vpnguide.partsbay.ae', '_blank')}
              >
                Помощь с VPN
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RegionBlockingNotice;
