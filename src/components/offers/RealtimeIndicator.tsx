
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wifi, WifiOff, RefreshCw, Info, Activity } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdateTime?: Date;
  realtimeEvents?: string[];
  freshDataIndicator?: boolean;
  onForceRefresh?: () => void;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  lastUpdateTime,
  realtimeEvents = [],
  freshDataIndicator = false,
  onForceRefresh
}) => {
  const [showDebug, setShowDebug] = useState(false);

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
        className={`flex items-center gap-1 transition-all duration-300 ${
          isConnected ? 'bg-green-500 text-white border-green-500' : 'bg-gray-400 text-white border-gray-400'
        }`}
      >
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isConnected ? 'Real-time' : 'Polling'}</span>
      </Badge>
      
      {lastUpdateTime && (
        <span className="text-gray-500">
          {formatLastUpdate(lastUpdateTime)}
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
      
      {/* Улучшенный индикатор свежих данных */}
      {(isFreshData || freshDataIndicator) && (
        <div className="flex items-center gap-1 text-green-600 text-xs animate-pulse">
          <Activity className="h-3 w-3" />
          <span>Обновлено</span>
        </div>
      )}

      {/* Debug info popover */}
      <Popover open={showDebug} onOpenChange={setShowDebug}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-gray-100"
            title="Отладочная информация"
          >
            <Info className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Статус Realtime</div>
            <div className="text-xs space-y-1">
              <div>Подключение: {isConnected ? '✅ Активно' : '❌ Неактивно'}</div>
              <div>Последнее обновление: {formatLastUpdate(lastUpdateTime)}</div>
              <div>Режим: {isConnected ? 'Real-time' : 'Polling (каждые 10 сек)'}</div>
              <div>Свежие данные: {freshDataIndicator ? '✅ Да' : '❌ Нет'}</div>
            </div>
            
            {realtimeEvents.length > 0 && (
              <div className="mt-3">
                <div className="font-semibold text-sm mb-1">Последние события:</div>
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {realtimeEvents.map((event, index) => (
                    <div key={index} className="text-gray-600 font-mono">
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {realtimeEvents.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">
                Нет recent events
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
