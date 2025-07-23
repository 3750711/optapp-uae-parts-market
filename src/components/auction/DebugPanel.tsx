
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Activity, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PusherOfferEvent, PusherConnectionState } from '@/types/pusher';

interface DebugPanelProps {
  connectionState: PusherConnectionState;
  realtimeEvents: PusherOfferEvent[];
  lastUpdateTime: Date;
  onForceReconnect: () => void;
  onForceRefresh: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  connectionState,
  realtimeEvents,
  lastUpdateTime,
  onForceReconnect,
  onForceRefresh
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const getConnectionStatusColor = () => {
    switch (connectionState.connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState.connectionState) {
      case 'connected': return 'Подключено';
      case 'connecting': return 'Подключение...';
      case 'disconnected': return 'Отключено';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span>Отладка Real-time</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Статус подключения:</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
                <span className="text-sm">{getConnectionStatusText()}</span>
              </div>
            </div>
            
            {connectionState.lastError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Ошибка: {connectionState.lastError}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Попытки переподключения: {connectionState.reconnectAttempts}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onForceReconnect}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Переподключить
              </Button>
            </div>
          </div>

          {/* Last Update Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Последнее обновление:</span>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {lastUpdateTime.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onForceRefresh}
              className="w-full h-6 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Принудительное обновление
            </Button>
          </div>

          {/* Real-time Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">События real-time:</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {realtimeEvents.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEvents(!showEvents)}
                  className="h-6 w-6 p-0"
                >
                  {showEvents ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {showEvents && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {realtimeEvents.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Нет событий
                  </div>
                ) : (
                  realtimeEvents.slice(0, 5).map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className="text-xs p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.action}</span>
                        <span className="text-gray-500">
                          {new Date(event.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        Товар: {event.product_id.slice(0, 8)}...
                      </div>
                      <div className="text-gray-600">
                        Цена: ${event.offered_price}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
