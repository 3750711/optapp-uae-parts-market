
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface RealtimeDiagnosticsProps {
  isConnected: boolean;
  lastUpdateTime?: Date;
  realtimeEvents?: any[];
  connectionState: any;
  onRefresh: () => void;
}

export const RealtimeDiagnostics: React.FC<RealtimeDiagnosticsProps> = ({
  isConnected,
  lastUpdateTime,
  realtimeEvents = [],
  connectionState,
  onRefresh
}) => {
  const getStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Диагностика Real-time системы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">Статус подключения:</span>
              <Badge className={getStatusColor()}>
                {isConnected ? 'Подключено' : 'Отключено'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Состояние:</span>
              <Badge variant="outline">{connectionState.connectionState}</Badge>
            </div>
            
            {lastUpdateTime && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Последнее обновление:</span>
                <span className="text-sm text-gray-600">
                  {lastUpdateTime.toLocaleTimeString('ru-RU')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="font-medium">События:</span>
              <Badge variant="secondary">{realtimeEvents.length}</Badge>
            </div>
            
            {connectionState.reconnectAttempts > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Попыток переподключения:</span>
                <Badge variant="outline">{connectionState.reconnectAttempts}</Badge>
              </div>
            )}
            
            {connectionState.lastError && (
              <div className="text-sm text-red-600">
                Ошибка: {connectionState.lastError}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Обновить данные
          </Button>
        </div>

        {realtimeEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Последние события:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {realtimeEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.action}
                    </Badge>
                    <span>Продукт: {event.product_id?.substring(0, 8)}...</span>
                    {event.offered_price && (
                      <span>Цена: ${event.offered_price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
