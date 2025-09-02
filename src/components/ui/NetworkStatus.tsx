import React from 'react';
import { Wifi, WifiOff, Smartphone } from 'lucide-react';
import { useNetworkHandler } from '@/hooks/useNetworkHandler';

export const NetworkStatus: React.FC = () => {
  const { isOnline, isCellular } = useNetworkHandler();

  if (!isOnline) {
    return (
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm">
        <WifiOff className="w-4 h-4" />
        Нет сети
      </div>
    );
  }

  if (isCellular) {
    return (
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-sm">
        <Smartphone className="w-4 h-4" />
        Мобильная сеть
      </div>
    );
  }

  return null;
};