import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Smartphone, Globe, RotateCw, AlertCircle } from 'lucide-react';
import { useA2HS } from '@/hooks/useA2HS';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useLanguage } from '@/hooks/useLanguage';

interface PWAIndicatorsProps {
  className?: string;
  showOfflineIndicator?: boolean;
  showInstallStatus?: boolean;
  showSyncStatus?: boolean;
}

export const PWAIndicators: React.FC<PWAIndicatorsProps> = ({
  className = '',
  showOfflineIndicator = true,
  showInstallStatus = true,
  showSyncStatus = true
}) => {
  const { isInstalled } = useA2HS();
  const { getPendingCount } = useBackgroundSync();
  const { language } = useLanguage();
  
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const pendingCount = getPendingCount();

  const t = language === 'en' ? {
    online: 'Online',
    offline: 'Offline',
    installed: 'PWA',
    browser: 'Browser',
    syncing: 'Syncing',
    pending: 'Pending'
  } : {
    online: 'Онлайн',
    offline: 'Офлайн',
    installed: 'PWA',
    browser: 'Браузер',
    syncing: 'Синхр.',
    pending: 'Ожидает'
  };

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show in development or when offline/has pending syncs
  const shouldShow = import.meta.env.DEV || !isOnline || pendingCount > 0;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex flex-col gap-2 ${className}`}>
      {/* Online/Offline Indicator */}
      {showOfflineIndicator && (
        <Badge 
          variant={isOnline ? "secondary" : "destructive"}
          className="flex items-center gap-1 text-xs"
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              {t.online}
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              {t.offline}
            </>
          )}
        </Badge>
      )}

      {/* Install Status */}
      {showInstallStatus && import.meta.env.DEV && (
        <Badge 
          variant={isInstalled ? "default" : "outline"}
          className="flex items-center gap-1 text-xs"
        >
          {isInstalled ? (
            <>
              <Smartphone className="h-3 w-3" />
              {t.installed}
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" />
              {t.browser}
            </>
          )}
        </Badge>
      )}

      {/* Background Sync Status */}
      {showSyncStatus && pendingCount > 0 && (
        <Badge 
          variant="outline"
          className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
        >
          {isOnline ? (
            <>
              <RotateCw className="h-3 w-3 animate-spin" />
              {t.syncing}
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              {t.pending} ({pendingCount})
            </>
          )}
        </Badge>
      )}
    </div>
  );
};