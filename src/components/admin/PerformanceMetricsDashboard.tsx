import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  RefreshCw,
  Zap,
  Target,
  Database
} from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

export const PerformanceMetricsDashboard: React.FC = () => {
  const { 
    metrics, 
    exportMetrics, 
    reset 
  } = usePerformanceMonitor();

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportMetrics();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-offers-metrics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms === 0) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (value: number, good: number, warning: number): string => {
    if (isNaN(value)) return 'text-gray-600';
    if (value <= good) return 'text-green-600';
    if (value <= warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, good: number, warning: number): { variant: string; text: string } => {
    if (isNaN(value)) return { variant: 'secondary', text: 'Нет данных' };
    if (value <= good) return { variant: 'default', text: 'Отлично' };
    if (value <= warning) return { variant: 'secondary', text: 'Хорошо' };
    return { variant: 'destructive', text: 'Требует внимания' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Метрики производительности Price Offers</h2>
          <p className="text-muted-foreground">
            Мониторинг real-time системы предложений цен
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={reset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Сбросить
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Экспорт...' : 'Экспорт'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time обновления</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.realTimeUpdates.average, 50, 100)}>
                {formatTime(metrics.realTimeUpdates.average)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.realTimeUpdates.average, 50, 100).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.realTimeUpdates.average, 50, 100).text}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Всего: {metrics.realTimeUpdates.count} / Макс: {formatTime(metrics.realTimeUpdates.max)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debounce операции</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.debounceOperations.average, 100, 200)}>
                {formatTime(metrics.debounceOperations.average)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.debounceOperations.average, 100, 200).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.debounceOperations.average, 100, 200).text}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Всего: {metrics.debounceOperations.count} / Макс: {formatTime(metrics.debounceOperations.max)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query выполнения</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.queryExecutions.average, 200, 500)}>
                {formatTime(metrics.queryExecutions.average)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.queryExecutions.average, 200, 500).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.queryExecutions.average, 200, 500).text}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Всего: {metrics.queryExecutions.count} / Макс: {formatTime(metrics.queryExecutions.max)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Статистика производительности
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Real-time обновления</span>
                <span className="font-semibold">{formatTime(metrics.realTimeUpdates.average)}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, 100 - (metrics.realTimeUpdates.average / 2)))} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Debounce операции</span>
                <span className="font-semibold">{formatTime(metrics.debounceOperations.average)}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, 100 - (metrics.debounceOperations.average / 3)))} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Query выполнения</span>
                <span className="font-semibold">{formatTime(metrics.queryExecutions.average)}</span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, 100 - (metrics.queryExecutions.average / 10)))} 
                className="h-2" 
              />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Всего операций</span>
                  <div className="font-semibold">
                    {metrics.realTimeUpdates.count + metrics.debounceOperations.count + metrics.queryExecutions.count}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Средняя производительность</span>
                  <div className="font-semibold">
                    {formatTime((metrics.realTimeUpdates.average + metrics.debounceOperations.average + metrics.queryExecutions.average) / 3)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Цели производительности
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <div className="font-semibold text-green-800">Real-time обновления</div>
                  <div className="text-sm text-green-600">Цель: &lt; 50ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.realTimeUpdates.average < 50 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <div className="font-semibold text-blue-800">Debounce операции</div>
                  <div className="text-sm text-blue-600">Цель: &lt; 100ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.debounceOperations.average < 100 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div>
                  <div className="font-semibold text-purple-800">Query выполнения</div>
                  <div className="text-sm text-purple-600">Цель: &lt; 200ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.queryExecutions.average < 200 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {(metrics.realTimeUpdates.average > 100 || metrics.queryExecutions.average > 500) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-800">Производительность требует внимания</div>
                  <div className="text-sm text-red-600">
                    Некоторые операции выполняются медленно
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};