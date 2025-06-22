
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getHealthStatus, getErrorMetrics, centralErrorMonitor } from '@/utils/errorMonitoring';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface HealthMonitorProps {
  showInProduction?: boolean;
}

const HealthMonitor: React.FC<HealthMonitorProps> = ({ showInProduction = false }) => {
  const [health, setHealth] = useState(getHealthStatus());
  const [metrics, setMetrics] = useState(getErrorMetrics());
  const [isVisible, setIsVisible] = useState(false);

  // Показываем только в development или если явно разрешено в production
  const shouldShow = import.meta.env.DEV || showInProduction;

  useEffect(() => {
    if (!shouldShow) return;

    const updateHealth = () => {
      setHealth(getHealthStatus());
      setMetrics(getErrorMetrics());
    };

    // Обновляем каждые 30 секунд
    const interval = setInterval(updateHealth, 30000);
    
    // Слушаем события критических ошибок
    const handleEmergency = () => {
      updateHealth();
      setIsVisible(true);
    };

    window.addEventListener('emergency-protocol', handleEmergency);

    return () => {
      clearInterval(interval);
      window.removeEventListener('emergency-protocol', handleEmergency);
    };
  }, [shouldShow]);

  if (!shouldShow && health.status === 'healthy') {
    return null;
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Автоматически показываем при проблемах
  if (health.status !== 'healthy' && !isVisible) {
    setIsVisible(true);
  }

  return (
    <>
      {/* Кнопка для показа/скрытия в development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(!isVisible)}
            className="flex items-center gap-2"
          >
            {getStatusIcon()}
            Health
          </Button>
        </div>
      )}

      {/* Панель мониторинга */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80">
          <Alert className={`border-2 ${getStatusColor()}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-semibold">
                  System Health: {health.status.toUpperCase()}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Recent Errors:</span>
                  <Badge variant={health.recentErrors > 5 ? 'destructive' : 'secondary'}>
                    {health.recentErrors}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Total Errors:</span>
                  <Badge variant="outline">{health.totalErrors}</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Critical Errors:</span>
                  <Badge variant={health.criticalErrors > 0 ? 'destructive' : 'secondary'}>
                    {health.criticalErrors}
                  </Badge>
                </div>

                {health.lastError && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Last Error: {health.lastError.toLocaleTimeString()}
                  </div>
                )}

                {import.meta.env.DEV && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => centralErrorMonitor.reset()}
                      className="text-xs"
                    >
                      Reset Metrics
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => console.log('Metrics:', metrics)}
                      className="text-xs"
                    >
                      Log Details
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default HealthMonitor;
