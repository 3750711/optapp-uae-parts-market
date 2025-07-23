
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw, Activity } from 'lucide-react';

interface ConnectionState {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  lastError?: string;
  reconnectAttempts: number;
}

interface PusherConnectionIndicatorProps {
  connectionState: ConnectionState;
  onReconnect: () => void;
  lastUpdateTime?: Date;
  realtimeEvents?: any[];
  compact?: boolean;
}

export const PusherConnectionIndicator: React.FC<PusherConnectionIndicatorProps> = ({
  connectionState,
  onReconnect,
  lastUpdateTime,
  realtimeEvents = [],
  compact = false
}) => {
  const { isConnected, connectionState: state, lastError } = connectionState;

  const getStatusColor = () => {
    switch (state) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected': return 'Real-time активен';
      case 'connecting': return 'Подключение...';
      case 'disconnected': return 'Отключено';
      case 'failed': return 'Ошибка соединения';
      default: return 'Неизвестно';
    }
  };

  const hasRecentEvents = realtimeEvents.length > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {hasRecentEvents && (
            <Activity className="w-3 h-3 text-green-600 animate-pulse" />
          )}
        </div>
        {!isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReconnect}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
          {hasRecentEvents && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>Активность</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Подключено' : 'Отключено'}
          </Badge>
          
          {!isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReconnect}
              className="h-7 px-3"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Переподключить
            </Button>
          )}
        </div>
      </div>

      {lastUpdateTime && (
        <div className="text-xs text-gray-500 mt-1">
          Последнее обновление: {lastUpdateTime.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      )}
      
      {lastError && (
        <div className="text-xs text-red-600 mt-1">
          Ошибка: {lastError}
        </div>
      )}
    </div>
  );
};
