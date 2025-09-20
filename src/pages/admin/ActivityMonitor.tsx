import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Activity, AlertCircle, Clock, LogIn, LogOut, Timer, RotateCcw, Shield, BarChart3, Database, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { 
  useUserSessions, 
  useSessionStats, 
  useComputeUserSessions, 
  getTerminationReasonColor, 
  getTerminationReasonLabel, 
  formatDuration,
  isLongSession,
  SESSION_TIMEOUT_MINUTES as TIMEOUT_MINS, 
  LONG_SESSION_HOURS as LONG_HOURS
} from '@/hooks/useUserSessions';

const TERMINATION_REASON_ICONS = {
  'active': LogIn,
  'explicit_logout': LogOut,
  'new_login': RotateCcw,
  'timeout': Timer,
  'forced_logout': Shield
};

export default function ActivityMonitor() {
  const [emailFilter, setEmailFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  
  const { data: sessions, isLoading, isError, refetch } = useUserSessions(200);
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const computeSessionsMutation = useComputeUserSessions();

  // Apply filters
  const filteredSessions = React.useMemo(() => {
    if (!sessions) return [];
    
    return sessions.filter(session => {
      const emailMatch = !emailFilter || 
        session.profiles?.email?.toLowerCase().includes(emailFilter.toLowerCase()) ||
        session.profiles?.full_name?.toLowerCase().includes(emailFilter.toLowerCase());
      
      const reasonMatch = !reasonFilter || reasonFilter === 'all' || 
        session.termination_reason === reasonFilter;
      
      return emailMatch && reasonMatch;
    });
  }, [sessions, emailFilter, reasonFilter]);

  const resetFilters = () => {
    setEmailFilter('');
    setReasonFilter('');
  };

  const handleComputeSessions = () => {
    computeSessionsMutation.mutate();
  };

  const getSessionDuration = (session: any) => {
    const startTime = new Date(session.started_at).getTime();
    const endTime = session.ended_at ? 
      new Date(session.ended_at).getTime() : 
      Date.now();
    
    const durationMinutes = (endTime - startTime) / (1000 * 60);
    return formatDuration(durationMinutes);
  };

  if (isError) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Ошибка загрузки данных сессий</span>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Мониторинг пользовательских сессий</h1>
          <p className="text-muted-foreground mt-2">Отслеживание сессий с причинами завершения</p>
        </div>

        {/* Compute Sessions Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Управление сессиями
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleComputeSessions}
                disabled={computeSessionsMutation.isPending}
                className="flex items-center gap-2"
              >
                {computeSessionsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Вычислить сессии
              </Button>
              <p className="text-sm text-muted-foreground">
                Анализировать логи событий и обновить таблицу сессий
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-filter">Поиск пользователя</Label>
                <Input
                  id="email-filter"
                  placeholder="Email или имя"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason-filter">Причина завершения</Label>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все причины" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все причины</SelectItem>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="explicit_logout">Выход</SelectItem>
                    <SelectItem value="new_login">Новый вход</SelectItem>
                    <SelectItem value="timeout">Тайм-аут</SelectItem>
                    <SelectItem value="forced_logout">Принуд. выход</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex gap-2 w-full">
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Обновить
                  </Button>
                  <Button onClick={resetFilters} variant="outline" size="sm">
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Статистика сессий
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Загрузка статистики...
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Всего сессий</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
                    <div className="text-sm text-muted-foreground">Активных</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.longSessions}</div>
                    <div className="text-sm text-muted-foreground">Длинных (&gt;{LONG_HOURS}ч)</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {filteredSessions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Отфильтровано</div>
                  </div>
                </div>

                {/* Termination Reasons */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Причины завершения сессий</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.terminationReasons).map(([reason, count]) => {
                      const percentage = stats.totalSessions > 0 ? ((count / stats.totalSessions) * 100).toFixed(1) : '0';
                      const avgDuration = stats.avgDurationByReason[reason] || 0;
                      
                      const IconComponent = TERMINATION_REASON_ICONS[reason as keyof typeof TERMINATION_REASON_ICONS];
                      
                      return (
                        <div key={reason} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getTerminationReasonColor(reason)}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {getTerminationReasonLabel(reason)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Количество:</span>
                              <span className="font-medium">{count} ({percentage}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Сред. длительность:</span>
                              <span className="font-medium">
                                {avgDuration > 0 ? formatDuration(avgDuration) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Нет данных для статистики
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Пользовательские сессии
              {filteredSessions && (
                <Badge variant="secondary">
                  {filteredSessions.length} сессий
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Загрузка сессий...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет сессий для отображения. Возможно, нужно сначала вычислить сессии из логов событий.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Начало сессии</TableHead>
                        <TableHead>Конец сессии</TableHead>
                        <TableHead>Длительность</TableHead>
                        <TableHead>Последняя активность</TableHead>
                        <TableHead>Причина завершения</TableHead>
                        <TableHead>Детали</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions?.map((session) => {
                        const IconComponent = TERMINATION_REASON_ICONS[session.termination_reason];
                        const isLong = isLongSession(session.started_at, session.ended_at);
                        
                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {session.profiles?.full_name || 'Не указано'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {session.profiles?.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {session.profiles?.user_type}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(session.started_at), 'dd.MM.yyyy HH:mm:ss')}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {session.ended_at ? 
                                format(new Date(session.ended_at), 'dd.MM.yyyy HH:mm:ss') : 
                                <Badge variant="outline" className="text-green-600">Активна</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {getSessionDuration(session)}
                                {isLong && (
                                  <Badge variant="destructive" className="text-xs">
                                    Длинная
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {session.last_activity_time ? 
                                format(new Date(session.last_activity_time), 'dd.MM.yyyy HH:mm:ss') : 
                                'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge className={getTerminationReasonColor(session.termination_reason)}>
                                <IconComponent className="h-3 w-3 mr-1" />
                                {getTerminationReasonLabel(session.termination_reason)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm text-muted-foreground truncate" title={session.termination_details || 'Нет деталей'}>
                                {session.termination_details || 'Нет деталей'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}