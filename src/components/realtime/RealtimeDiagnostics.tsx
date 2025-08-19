import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeProvider';

interface RealtimeDiagnosticsProps {
  onRefresh?: () => void;
}

export const RealtimeDiagnostics: React.FC<RealtimeDiagnosticsProps> = ({
  onRefresh
}) => {
  const { isConnected, connectionState, lastError, realtimeEvents, forceReconnect } = useRealtime();
  
  const getStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusColor = () => {
    if (isConnected) return 'bg-success/10 text-success';
    return 'bg-destructive/10 text-destructive';
  };

  const lastUpdateTime = realtimeEvents.length > 0 ? new Date(realtimeEvents[0].timestamp) : undefined;

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
              <Wifi className="h-4 w-4 text-primary" />
              <span className="font-medium">Состояние:</span>
              <Badge variant="outline">{connectionState}</Badge>
            </div>
            
            {lastUpdateTime && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-accent" />
                <span className="font-medium">Последнее обновление:</span>
                <span className="text-sm text-muted-foreground">
                  {lastUpdateTime.toLocaleTimeString('ru-RU')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              <span className="font-medium">События:</span>
              <Badge variant="secondary">{realtimeEvents.length}</Badge>
            </div>
            
            {lastError && (
              <div className="text-sm text-destructive">
                Ошибка: {lastError}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Обновить данные
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceReconnect}
            className="flex items-center gap-2"
          >
            <Wifi className="h-3 w-3" />
            Переподключить
          </Button>
        </div>

        {realtimeEvents.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Последние события:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {realtimeEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {event.action}
                    </Badge>
                    <span>Тип: {event.type}</span>
                    {event.product_id && (
                      <span>Продукт: {event.product_id.substring(0, 8)}...</span>
                    )}
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