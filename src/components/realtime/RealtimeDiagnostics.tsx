import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, RefreshCw, AlertCircle, CheckCircle, WifiOff, Clock, Globe } from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeProvider';

interface RealtimeDiagnosticsProps {
  onRefresh?: () => void;
}

export const RealtimeDiagnostics: React.FC<RealtimeDiagnosticsProps> = ({
  onRefresh
}) => {
  const { 
    isConnected, 
    connectionState, 
    lastError, 
    realtimeEvents, 
    forceReconnect,
    diagnostics,
    isUsingFallback,
    reconnectAttempts
  } = useRealtime();
  
  const getStatusIcon = () => {
    if (isUsingFallback) return <Globe className="h-4 w-4 text-warning" />;
    if (isConnected) return <CheckCircle className="h-4 w-4 text-success" />;
    if (connectionState === 'connecting') return <Clock className="h-4 w-4 text-primary" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusColor = () => {
    if (isUsingFallback) return 'bg-warning/10 text-warning';
    if (isConnected) return 'bg-success/10 text-success';
    if (connectionState === 'connecting') return 'bg-primary/10 text-primary';
    return 'bg-destructive/10 text-destructive';
  };

  const getStatusText = () => {
    if (isUsingFallback) return 'Режим опроса';
    if (isConnected) return 'Подключено';
    if (connectionState === 'connecting') return 'Подключение...';
    return 'Отключено';
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">Статус:</span>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="font-medium">Состояние:</span>
              <Badge variant="outline">{connectionState}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Попыток:</span>
              <Badge variant={reconnectAttempts > 0 ? 'destructive' : 'outline'}>
                {reconnectAttempts}/5
              </Badge>
            </div>
            
            {lastUpdateTime && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-accent" />
                <span className="font-medium">Последнее:</span>
                <span className="text-sm text-muted-foreground">
                  {lastUpdateTime.toLocaleTimeString('ru-RU')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              <span className="font-medium">События:</span>
              <Badge variant="secondary">{realtimeEvents.length}</Badge>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Браузер:</div>
              <div className="flex gap-2">
                <Badge variant={diagnostics.browserSupport ? 'default' : 'destructive'} className="text-xs">
                  WebSocket: {diagnostics.browserSupport ? 'OK' : 'Нет'}
                </Badge>
                {diagnostics.firefoxDetected && (
                  <Badge variant="secondary" className="text-xs">Firefox</Badge>
                )}
              </div>
            </div>

            {diagnostics.connectionTest && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Тест соединения:</div>
                <div className="flex items-center gap-2">
                  <Badge variant={diagnostics.connectionTest.success ? 'default' : 'destructive'} className="text-xs">
                    {diagnostics.connectionTest.success ? 'Успех' : 'Ошибка'}
                  </Badge>
                  {diagnostics.connectionTest.latency && (
                    <span className="text-xs text-muted-foreground">
                      {diagnostics.connectionTest.latency}ms
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {lastError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm text-destructive font-medium">Ошибка:</div>
            <div className="text-sm text-destructive mt-1">{lastError}</div>
            {diagnostics.firefoxDetected && (
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Рекомендации для Firefox:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Проверьте network.websocket.enabled в about:config</li>
                  <li>Отключите Enhanced Tracking Protection для этого сайта</li>
                  <li>Проверьте настройки прокси/файрвола</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {isUsingFallback && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
            <div className="text-sm font-medium text-warning">Режим опроса активен</div>
            <div className="text-sm text-muted-foreground mt-1">
              WebSocket недоступен. Данные обновляются каждые 10 секунд через HTTP запросы.
            </div>
          </div>
        )}

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