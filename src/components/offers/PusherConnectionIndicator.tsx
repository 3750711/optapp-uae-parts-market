
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { PusherConnectionState } from '@/types/pusher';

interface PusherConnectionIndicatorProps {
  connectionState: PusherConnectionState;
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
  const { isConnected, connectionState: state, lastError, reconnectAttempts } = connectionState;

  const getStatusColor = () => {
    switch (state) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
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

  const getStatusIcon = () => {
    switch (state) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <RotateCcw className="w-4 h-4 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
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
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{getStatusText()}</span>
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

      <div className="space-y-1 text-xs text-gray-600">
        {lastUpdateTime && (
          <div>
            Последнее обновление: {lastUpdateTime.toLocaleTimeString()}
          </div>
        )}
        
        {reconnectAttempts > 0 && (
          <div>
            Попыток переподключения: {reconnectAttempts}
          </div>
        )}
        
        {lastError && (
          <div className="text-red-600">
            Ошибка: {lastError}
          </div>
        )}
        
        {realtimeEvents.length > 0 && (
          <div>
            Real-time событий: {realtimeEvents.length}
          </div>
        )}
      </div>
    </div>
  );
};
