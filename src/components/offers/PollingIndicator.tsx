
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Clock, Zap, AlertTriangle, RefreshCw } from 'lucide-react';

interface PollingIndicatorProps {
  priority: 'critical' | 'high' | 'medium' | 'low' | 'stopped';
  interval: number;
  isActive: boolean;
  isVisible?: boolean;
  lastUpdateTime?: Date;
  onForceRefresh?: () => void;
}

export const PollingIndicator: React.FC<PollingIndicatorProps> = ({
  priority,
  interval,
  isActive,
  isVisible = true,
  lastUpdateTime,
  onForceRefresh
}) => {
  const getIndicatorConfig = () => {
    switch (priority) {
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'bg-red-500',
          text: 'Критично',
          pulse: true
        };
      case 'high':
        return {
          icon: Zap,
          color: 'bg-orange-500',
          text: 'Высокая',
          pulse: true
        };
      case 'medium':
        return {
          icon: Wifi,
          color: 'bg-green-500',
          text: 'Средняя',
          pulse: false
        };
      case 'low':
        return {
          icon: Clock,
          color: 'bg-gray-500',
          text: 'Низкая',
          pulse: false
        };
      case 'stopped':
        return {
          icon: WifiOff,
          color: 'bg-gray-400',
          text: 'Остановлено',
          pulse: false
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;
  const intervalText = interval >= 1000 ? `${interval / 1000}с` : `${interval}мс`;

  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'Никогда';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 10000) return 'Только что';
    if (diff < 60000) return `${Math.floor(diff / 1000)}с назад`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}м назад`;
    
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${config.color} text-white border-none ${
          config.pulse && isActive ? 'animate-pulse' : ''
        }`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
      
      <div className="flex items-center gap-1 text-gray-500">
        <span>
          {intervalText}
          {!isVisible && ' (фон)'}
        </span>
        
        {lastUpdateTime && (
          <span className="text-gray-400">
            • {formatLastUpdate(lastUpdateTime)}
          </span>
        )}
      </div>
      
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
      
      {isActive && config.pulse && (
        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
      )}
    </div>
  );
};
