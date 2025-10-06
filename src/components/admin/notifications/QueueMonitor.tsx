import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QueueMetrics {
  total_pending: number;
  total_processing: number;
  total_completed: number;
  total_failed: number;
  total_dead_letter: number;
  high_priority_pending: number;
  avg_processing_time_ms: number;
}

interface DeadLetterItem {
  id: string;
  notification_type: string;
  priority: string;
  payload: any;
  attempts: number;
  last_error: string;
  created_at: string;
}

export function QueueMonitor() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [deadLetterQueue, setDeadLetterQueue] = useState<DeadLetterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_queue_metrics');
      
      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch queue metrics:', error);
      toast.error('Не удалось загрузить метрики очереди');
    }
  };

  const fetchDeadLetterQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'dead_letter')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setDeadLetterQueue(data || []);
    } catch (error) {
      console.error('Failed to fetch dead letter queue:', error);
    }
  };

  const handleRetry = async (notificationId: string) => {
    setRetrying(notificationId);
    try {
      const { data, error } = await supabase.rpc('retry_dead_letter_notification', {
        p_notification_id: notificationId
      });

      if (error) throw error;

      if (data) {
        toast.success('Уведомление поставлено в очередь заново');
        await Promise.all([fetchMetrics(), fetchDeadLetterQueue()]);
      } else {
        toast.error('Не удалось повторить отправку');
      }
    } catch (error) {
      console.error('Failed to retry notification:', error);
      toast.error('Ошибка при повторной отправке');
    } finally {
      setRetrying(null);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchDeadLetterQueue()]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Мониторинг очереди уведомлений</h2>
          <p className="text-muted-foreground">Статистика и управление очередью Telegram</p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                В очереди
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_pending}</div>
              {metrics.high_priority_pending > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.high_priority_pending} высокий приоритет
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                В обработке
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Отправлено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_completed}</div>
              {metrics.avg_processing_time_ms > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.round(metrics.avg_processing_time_ms)}ms среднее время
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Ошибки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.total_dead_letter}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.total_failed} повторных попыток
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dead Letter Queue */}
      {deadLetterQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Dead Letter Queue ({deadLetterQueue.length})
            </CardTitle>
            <CardDescription>
              Уведомления, которые не удалось отправить после всех попыток
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadLetterQueue.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 space-y-2 bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {item.notification_type}
                        </Badge>
                        <Badge variant="outline">
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Попыток: {item.attempts}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">Payload:</span>{' '}
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {JSON.stringify(item.payload)}
                        </code>
                      </div>
                      
                      {item.last_error && (
                        <div className="text-sm text-red-600">
                          <span className="font-medium">Ошибка:</span> {item.last_error}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Создано: {new Date(item.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleRetry(item.id)}
                      disabled={retrying === item.id}
                    >
                      {retrying === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Повторить'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {deadLetterQueue.length === 0 && metrics && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Нет ошибок в очереди</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
