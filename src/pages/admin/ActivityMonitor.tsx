import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Calendar, User, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  event_subtype?: string;
  user_id?: string;
  path?: string;
  ip_address?: string;
  user_agent?: string;
  details: any;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
    user_type: string;
  };
}

const EVENT_TYPE_COLORS = {
  login: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  logout: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  page_view: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  client_error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  api_error: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  button_click: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

export default function ActivityMonitor() {
  // Filters state
  const [emailFilter, setEmailFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
  const itemsPerPage = 20;

  // Fetch activity logs with filters
  const { data: activityData, isLoading, isError, refetch } = useQuery({
    queryKey: ['activity-logs', currentPage, emailFilter, eventTypeFilter, dateFromFilter, dateToFilter],
    queryFn: async () => {
      let query = supabase
        .from('event_logs')
        .select(`
          id,
          action_type,
          entity_type,
          event_subtype,
          user_id,
          path,
          ip_address,
          user_agent,
          details,
          created_at,
          profiles!inner(email, full_name, user_type)
        `)
        .eq('entity_type', 'user_activity')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      // Apply filters
      if (emailFilter) {
        query = query.ilike('profiles.email', `%${emailFilter}%`);
      }

              if (eventTypeFilter && eventTypeFilter !== 'all') {
                query = query.eq('action_type', eventTypeFilter);
              }

      if (dateFromFilter) {
        query = query.gte('created_at', new Date(dateFromFilter).toISOString());
      }

      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data as ActivityLog[], count };
    },
    staleTime: 30000, // 30 seconds
  });

  // Get unique event types for filter dropdown
  const { data: eventTypes } = useQuery({
    queryKey: ['activity-event-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select('action_type')
        .eq('entity_type', 'user_activity')
        .order('action_type');

      if (error) throw error;

      const uniqueTypes = [...new Set(data.map(item => item.action_type))];
      return uniqueTypes;
    },
    staleTime: 300000, // 5 minutes
  });

  // Handle page navigation
  const totalPages = useMemo(() => {
    if (!activityData?.count) return 1;
    return Math.ceil(activityData.count / itemsPerPage);
  }, [activityData?.count]);

  const resetFilters = () => {
    setEmailFilter('');
    setEventTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return 'N/A';
    
    try {
      const formatted = JSON.stringify(metadata, null, 2);
      return formatted.length > 100 ? formatted.substring(0, 100) + '...' : formatted;
    } catch {
      return String(metadata).substring(0, 100);
    }
  };

  if (isError) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Ошибка загрузки данных активности</span>
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
          <h1 className="text-3xl font-bold text-foreground">Мониторинг активности</h1>
          <p className="text-muted-foreground mt-2">Отслеживание действий пользователей</p>
        </div>
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email-filter">Email пользователя</Label>
                <Input
                  id="email-filter"
                  placeholder="user@example.com"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-type-filter">Тип события</Label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {eventTypes?.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">Дата от</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Дата до</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
              <Button onClick={resetFilters} variant="outline" size="sm">
                Сбросить фильтры
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Лог активности
              {activityData?.count && (
                <Badge variant="secondary">
                  {activityData.count} событий
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Загрузка...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Событие</TableHead>
                      <TableHead>Путь</TableHead>
                      <TableHead>Метаданные</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityData?.data?.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{log.profiles?.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.profiles?.full_name || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge 
                              className={EVENT_TYPE_COLORS[log.action_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-800'}
                            >
                              {log.action_type}
                            </Badge>
                            {log.event_subtype && (
                              <div className="text-sm text-muted-foreground">
                                {log.event_subtype}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.path || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm font-mono text-muted-foreground truncate">
                            {formatMetadata(log.details)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Страница {currentPage} из {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Назад
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Вперёд
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Детали события
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Время:</strong>
                  <div className="font-mono">
                    {format(new Date(selectedLog.created_at), 'dd.MM.yyyy HH:mm:ss')}
                  </div>
                </div>
                <div>
                  <strong>Тип события:</strong>
                  <div>
                    <Badge className={EVENT_TYPE_COLORS[selectedLog.action_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-800'}>
                      {selectedLog.action_type}
                    </Badge>
                    {selectedLog.event_subtype && (
                      <div className="text-muted-foreground mt-1">
                        Подтип: {selectedLog.event_subtype}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <strong>Пользователь:</strong>
                  <div>{selectedLog.profiles?.email}</div>
                  <div className="text-muted-foreground">
                    {selectedLog.profiles?.full_name || 'N/A'} ({selectedLog.profiles?.user_type})
                  </div>
                </div>
                <div>
                  <strong>IP адрес:</strong>
                  <div className="font-mono">{selectedLog.ip_address || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <strong>Путь:</strong>
                  <div className="font-mono">{selectedLog.path || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <strong>User Agent:</strong>
                  <div className="font-mono text-xs break-all">
                    {selectedLog.user_agent || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <strong>Метаданные:</strong>
                <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}