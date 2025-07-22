
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, Zap, AlertTriangle } from 'lucide-react';

interface PollingIndicatorProps {
  priority: 'critical' | 'high' | 'medium' | 'low' | 'stopped';
  interval: number;
  isActive: boolean;
  isVisible?: boolean;
}

export const PollingIndicator: React.FC<PollingIndicatorProps> = ({
  priority,
  interval,
  isActive,
  isVisible = true
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
      
      <span className="text-gray-500">
        {intervalText}
        {!isVisible && ' (фон)'}
      </span>
      
      {isActive && config.pulse && (
        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
      )}
    </div>
  );
};
