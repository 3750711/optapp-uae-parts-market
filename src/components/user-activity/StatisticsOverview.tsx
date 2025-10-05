import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Eye, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { ActivityMetrics } from '@/hooks/user-activity/useActivityMetrics';

interface StatisticsOverviewProps {
  metrics: ActivityMetrics;
}

export const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего событий</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
          {metrics.trend !== 0 && (
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3" /> 
              {metrics.trend > 0 ? '+' : ''}{metrics.trend}% от прошлого
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          <p className="text-xs text-muted-foreground">За последние 24 часа</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Просмотры страниц</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pageViews.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Сегодня</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.errors > 0 ? 'text-destructive' : ''}`}>
            {metrics.errors}
          </div>
          <p className="text-xs text-muted-foreground">За последний час</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Средняя сессия</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avgSessionDuration > 0 ? `${metrics.avgSessionDuration}м` : '-'}
          </div>
          <p className="text-xs text-muted-foreground">Длительность</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Онлайн сейчас</CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.onlineNow}</div>
          <p className="text-xs text-muted-foreground">Активных сессий</p>
        </CardContent>
      </Card>
    </div>
  );
};
