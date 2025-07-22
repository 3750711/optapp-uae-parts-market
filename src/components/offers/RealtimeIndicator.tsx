
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdateTime?: Date;
  onForceRefresh?: () => void;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  lastUpdateTime,
  onForceRefresh
}) => {
  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'Никогда';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 5000) return 'Только что';
    if (diff < 60000) return `${Math.floor(diff / 1000)}с назад`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}м назад`;
    
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const isFreshData = lastUpdateTime && Date.now() - lastUpdateTime.getTime() < 3000;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${
          isConnected ? 'bg-green-500 text-white border-green-500' : 'bg-gray-400 text-white border-gray-400'
        }`}
      >
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isConnected ? 'Онлайн' : 'Оффлайн'}</span>
      </Badge>
      
      {lastUpdateTime && (
        <span className="text-gray-500">
          Обновлено: {formatLastUpdate(lastUpdateTime)}
        </span>
      )}
      
      {onForceRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onForceRefresh}
          className="h-6 px-2 text-xs hover:bg-gray-100"
          title="Обновить сейчас"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
      
      {isFreshData && (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Новые данные</span>
        </div>
      )}
    </div>
  );
};
