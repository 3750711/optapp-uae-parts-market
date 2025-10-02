import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MonitoringStatus {
  isActive: boolean;
  lastSessionCompute: Date | null;
  eventsLast24h: number;
  sessionsTotal: number;
  cronActive: boolean;
}

export const ActivityMonitoringStatus: React.FC = () => {
  const [status, setStatus] = useState<MonitoringStatus>({
    isActive: true,
    lastSessionCompute: null,
    eventsLast24h: 0,
    sessionsTotal: 0,
    cronActive: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      // Get last session compute time from system_metadata
      const { data: metadata } = await supabase
        .from('system_metadata')
        .select('value')
        .eq('key', 'last_session_compute_time')
        .single();

      // Get events count in last 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: eventsCount } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);

      // Get total sessions
      const { count: sessionsCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      setStatus({
        isActive: true,
        lastSessionCompute: metadata?.value 
          ? new Date(metadata.value) 
          : null,
        eventsLast24h: eventsCount || 0,
        sessionsTotal: sessionsCount || 0,
        cronActive: true
      });
    } catch (error) {
      console.error('Failed to load monitoring status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!status.lastSessionCompute) return 'yellow';
    const hoursSinceLastCompute = (Date.now() - status.lastSessionCompute.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCompute > 2) return 'red';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Статус мониторинга активности
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">События (24ч)</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {status.eventsLast24h}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Всего сессий</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {status.sessionsTotal}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Последний расчет</span>
              </div>
              <div className="flex items-center gap-2">
                {statusColor === 'green' && <CheckCircle className="h-3 w-3 text-green-500" />}
                {statusColor === 'yellow' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                {statusColor === 'red' && <AlertCircle className="h-3 w-3 text-destructive" />}
                <span className="text-xs text-muted-foreground">
                  {status.lastSessionCompute
                    ? formatDistanceToNow(status.lastSessionCompute, { 
                        addSuffix: true, 
                        locale: ru 
                      })
                    : 'Никогда'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-sm">Автоматический расчет</span>
              <Badge 
                variant={status.cronActive ? 'default' : 'destructive'}
                className="text-xs"
              >
                {status.cronActive ? '✓ Активен (каждый час)' : '✗ Неактивен'}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
