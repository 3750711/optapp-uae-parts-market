import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useUserActivity,
  useActivityStats,
  usePopularPages,
  getActionTypeColor,
  getActionTypeLabel,
} from '@/hooks/useEventLogs';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { RefreshCw, Activity, BarChart3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ActivityLogViewer = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useUserActivity(100);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useActivityStats();
  const { data: popularPages, isLoading: pagesLoading, refetch: refetchPages } = usePopularPages(10);

  const handleRefreshAll = () => {
    refetchActivities();
    refetchStats();
    refetchPages();
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd MMM yyyy, HH:mm:ss', { locale: ru });
    } catch {
      return timestamp;
    }
  };

  const formatDetailsJson = (details: any) => {
    if (!details) return '-';
    
    try {
      const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;
      
      // Extract meaningful info
      const parts: string[] = [];
      
      if (detailsObj.error) parts.push(`❌ ${detailsObj.error}`);
      if (detailsObj.message) parts.push(detailsObj.message);
      if (detailsObj.status) parts.push(`Status: ${detailsObj.status}`);
      if (detailsObj.path) parts.push(`Path: ${detailsObj.path}`);
      
      return parts.length > 0 ? parts.join(' | ') : JSON.stringify(detailsObj);
    } catch {
      return String(details);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Логи активности</h2>
          <p className="text-muted-foreground">Мониторинг действий пользователей в реальном времени</p>
        </div>
        <Button onClick={handleRefreshAll} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Активность
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="mr-2 h-4 w-4" />
            Статистика
          </TabsTrigger>
          <TabsTrigger value="pages">
            <Eye className="mr-2 h-4 w-4" />
            Популярные страницы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последняя активность (100 событий)</CardTitle>
              <CardDescription>
                Автообновление каждые 30 секунд
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : !activities || activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Нет данных</div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Время</TableHead>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Действие</TableHead>
                        <TableHead>Тип сущности</TableHead>
                        <TableHead>Детали</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-mono text-xs">
                            {formatTime(activity.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {activity.profiles?.full_name || 'Гость'}
                              </span>
                              {activity.profiles?.email && (
                                <span className="text-xs text-muted-foreground">
                                  {activity.profiles.email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionTypeColor(activity.action_type)}>
                              {getActionTypeLabel(activity.action_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{activity.entity_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate text-xs">
                            {formatDetailsJson(activity.details)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по типам действий</CardTitle>
              <CardDescription>За последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : !stats || stats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Нет данных</div>
              ) : (
                <div className="space-y-4">
                  {stats
                    .sort((a, b) => b.count - a.count)
                    .map((stat) => (
                      <div
                        key={stat.action_type}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={getActionTypeColor(stat.action_type)}>
                            {getActionTypeLabel(stat.action_type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {stat.action_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${Math.min(
                                  (stat.count / Math.max(...stats.map((s) => s.count))) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-lg w-16 text-right">
                            {stat.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Популярные страницы</CardTitle>
              <CardDescription>
                Топ-10 по последним 1000 просмотрам
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : !popularPages || popularPages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Нет данных</div>
              ) : (
                <div className="space-y-3">
                  {popularPages.map((page, index) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {page.path}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">
                          {page.visits.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
