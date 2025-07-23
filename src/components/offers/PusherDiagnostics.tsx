
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { PusherConnectionState } from '@/types/pusher';

interface PusherDiagnosticsProps {
  connectionState: PusherConnectionState;
  realtimeEvents: any[];
  lastUpdateTime?: Date;
  onReconnect: () => void;
  onForceRefresh: () => void;
}

export const PusherDiagnostics: React.FC<PusherDiagnosticsProps> = ({
  connectionState,
  realtimeEvents,
  lastUpdateTime,
  onReconnect,
  onForceRefresh
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

  const recentEvents = realtimeEvents.slice(0, 5);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Диагностика Pusher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <div>
              <div className="font-medium">Состояние подключения</div>
              <div className="text-sm text-gray-600">{state}</div>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? 'Подключено' : 'Отключено'}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Real-time события</div>
            <div className="text-2xl font-bold text-blue-900">{realtimeEvents.length}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600">Попытки переподключения</div>
            <div className="text-2xl font-bold text-purple-900">{reconnectAttempts}</div>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdateTime && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">Последнее обновление</div>
            <div className="font-mono text-green-900">
              {lastUpdateTime.toLocaleString('ru-RU')}
            </div>
          </div>
        )}

        {/* Error */}
        {lastError && (
          <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-900">Ошибка</div>
              <div className="text-sm text-red-700">{lastError}</div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm">Последние события</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentEvents.map((event, index) => (
                <div key={index} className="text-xs p-2 bg-gray-100 rounded font-mono">
                  {event.action} - {event.product_id?.substring(0, 8)}... - ${event.offered_price}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnect}
            disabled={isConnected}
            className="flex items-center gap-1"
          >
            <Wifi className="h-3 w-3" />
            Переподключить
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onForceRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Обновить данные
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
