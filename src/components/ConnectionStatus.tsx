
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react';
import { useUnifiedRealtimeManager } from '@/hooks/useUnifiedRealtimeManager';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdateTime: Date;
  onForceRefresh?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastUpdateTime,
  onForceRefresh,
  className = ''
}) => {
  const { getAllChannelStatuses } = useUnifiedRealtimeManager();
  const channelStatuses = getAllChannelStatuses();
  
  const connectedChannels = Object.values(channelStatuses).filter(status => status === 'SUBSCRIBED').length;
  const totalChannels = Object.keys(channelStatuses).length;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Connection Status Badge */}
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className={`flex items-center gap-1 ${
          isConnected 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }`}
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Онлайн' : 'Polling'}
      </Badge>

      {/* Channel Status */}
      {totalChannels > 0 && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {connectedChannels}/{totalChannels}
        </Badge>
      )}

      {/* Last Update Time */}
      <span className="text-muted-foreground">
        Обновлено: {formatTime(lastUpdateTime)}
      </span>

      {/* Force Refresh Button */}
      {onForceRefresh && (
        <Button
          size="sm"
          variant="outline"
          onClick={onForceRefresh}
          className="h-6 px-2"
          title="Принудительно обновить данные"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
