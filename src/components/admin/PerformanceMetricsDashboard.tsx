import React, { useState, useEffect } from 'react';
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
  Target
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
      const blob = new Blob([data], { type: 'application/json' });
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
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (value: number, good: number, warning: number): string => {
    if (value <= good) return 'text-green-600';
    if (value <= warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, good: number, warning: number): { variant: string; text: string } => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time латентность</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.averageRealTimeLatency, 500, 1000)}>
                {formatTime(metrics.averageRealTimeLatency)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.averageRealTimeLatency, 500, 1000).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.averageRealTimeLatency, 500, 1000).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimistic Updates</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(100 - metrics.successRate, 5, 15)}>
                {metrics.successRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.optimisticUpdateSuccess} успешных / {metrics.optimisticUpdateFailure} ошибок
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch запросы</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.averageBatchQueryTime, 200, 500)}>
                {formatTime(metrics.averageBatchQueryTime)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.averageBatchQueryTime, 200, 500).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.averageBatchQueryTime, 200, 500).text}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UI отклик</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.averageUIResponseTime, 100, 300)}>
                {formatTime(metrics.averageUIResponseTime)}
              </span>
            </div>
            <Badge 
              variant={getStatusBadge(metrics.averageUIResponseTime, 100, 300).variant as any}
              className="mt-2"
            >
              {getStatusBadge(metrics.averageUIResponseTime, 100, 300).text}
            </Badge>
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
                <span>Успешность Optimistic Updates</span>
                <span className="font-semibold">{metrics.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.successRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Производительность Real-time</span>
                <span className="font-semibold">
                  {metrics.averageRealTimeLatency < 500 ? '95%' : 
                   metrics.averageRealTimeLatency < 1000 ? '75%' : '45%'}
                </span>
              </div>
              <Progress 
                value={metrics.averageRealTimeLatency < 500 ? 95 : 
                       metrics.averageRealTimeLatency < 1000 ? 75 : 45} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Производительность Batch</span>
                <span className="font-semibold">
                  {metrics.averageBatchQueryTime < 200 ? '95%' : 
                   metrics.averageBatchQueryTime < 500 ? '80%' : '60%'}
                </span>
              </div>
              <Progress 
                value={metrics.averageBatchQueryTime < 200 ? 95 : 
                       metrics.averageBatchQueryTime < 500 ? 80 : 60} 
                className="h-2" 
              />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Общий уровень ошибок</span>
                  <div className={`font-semibold ${getStatusColor(metrics.errorRate, 2, 5)}`}>
                    {metrics.errorRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Всего предложений</span>
                  <div className="font-semibold">{metrics.totalOffers}</div>
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
                  <div className="font-semibold text-green-800">Real-time латентность</div>
                  <div className="text-sm text-green-600">Цель: &lt; 500ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.averageRealTimeLatency < 500 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <div className="font-semibold text-blue-800">Optimistic Updates</div>
                  <div className="text-sm text-blue-600">Цель: &gt; 95%</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.successRate > 95 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div>
                  <div className="font-semibold text-purple-800">Batch запросы</div>
                  <div className="text-sm text-purple-600">Цель: &lt; 200ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.averageBatchQueryTime < 200 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div>
                  <div className="font-semibold text-orange-800">UI отклик</div>
                  <div className="text-sm text-orange-600">Цель: &lt; 100ms</div>
                </div>
                <CheckCircle className={`h-5 w-5 ${
                  metrics.averageUIResponseTime < 100 ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            {metrics.errorRate > 5 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-800">Высокий уровень ошибок</div>
                  <div className="text-sm text-red-600">
                    Требуется оптимизация: {metrics.errorRate.toFixed(1)}%
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