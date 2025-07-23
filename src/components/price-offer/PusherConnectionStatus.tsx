
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PusherConnectionStatusProps {
  isConnected: boolean;
  connectionState: {
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
    lastError?: string;
    reconnectAttempts: number;
  };
  compact: boolean;
}

export const PusherConnectionStatus: React.FC<PusherConnectionStatusProps> = ({
  isConnected,
  connectionState,
  compact
}) => {
  const getStatusIcon = () => {
    switch (connectionState.connectionState) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionState.connectionState) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (connectionState.connectionState) {
      case 'connected':
        return 'online';
      case 'connecting':
        return 'соединение';
      case 'failed':
        return 'ошибка';
      default:
        return 'offline';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center">
        {getStatusIcon()}
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs",
        getStatusColor()
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {connectionState.reconnectAttempts > 0 && (
        <span className="text-xs opacity-75">
          ({connectionState.reconnectAttempts})
        </span>
      )}
    </Badge>
  );
};
