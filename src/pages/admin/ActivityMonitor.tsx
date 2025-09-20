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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, Search, Calendar, User, Activity, AlertCircle, ChevronDown, ChevronRight, Clock, LogIn, LogOut } from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';

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

interface UserSession {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  user_type?: string;
  login_time: string;
  logout_time?: string;
  logs: ActivityLog[];
  logs_count: number;
  is_active: boolean;
  session_duration?: string;
  unique_pages: number;
}

const EVENT_TYPE_COLORS = {
  login: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  logout: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  page_view: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  client_error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  api_error: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  button_click: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

// Function to group logs by user sessions
const groupLogsBySession = (logs: ActivityLog[]): UserSession[] => {
  if (!logs || logs.length === 0) return [];

  // Group logs by user_id
  const userLogs = logs.reduce((acc, log) => {
    if (!log.user_id) return acc;
    if (!acc[log.user_id]) acc[log.user_id] = [];
    acc[log.user_id].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  const sessions: UserSession[] = [];

  // Process each user's logs
  Object.entries(userLogs).forEach(([userId, userLogsList]) => {
    // Sort logs by timestamp
    const sortedLogs = userLogsList.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Find all login events
    const loginEvents = sortedLogs.filter(log => log.action_type === 'login');

    if (loginEvents.length === 0) {
      // If no login events, create a single session with all logs
      if (sortedLogs.length > 0) {
        const firstLog = sortedLogs[0];
        const uniquePages = new Set(
          sortedLogs.filter(log => log.path).map(log => log.path)
        ).size;

        sessions.push({
          id: `${userId}-session-0`,
          user_id: userId,
          email: firstLog.profiles?.email || 'Unknown',
          full_name: firstLog.profiles?.full_name,
          user_type: firstLog.profiles?.user_type,
          login_time: firstLog.created_at,
          logs: sortedLogs,
          logs_count: sortedLogs.length,
          is_active: true,
          unique_pages: uniquePages,
        });
      }
      return;
    }

    // Create sessions from login events
    loginEvents.forEach((loginEvent, index) => {
      const loginTime = new Date(loginEvent.created_at);
      
      // Find the end of this session (next login or logout)
      let sessionEndTime: Date | null = null;
      let logoutEvent: ActivityLog | null = null;
      
      // Look for logout after this login
      const subsequentLogs = sortedLogs.filter(log => 
        new Date(log.created_at) >= loginTime
      );
      
      const nextLogin = loginEvents[index + 1];
      const nextLoginTime = nextLogin ? new Date(nextLogin.created_at) : null;
      
      // Find logout between this login and next login (or after last login)
      for (const log of subsequentLogs) {
        if (log.action_type === 'logout') {
          const logoutTime = new Date(log.created_at);
          if (!nextLoginTime || logoutTime < nextLoginTime) {
            sessionEndTime = logoutTime;
            logoutEvent = log;
            break;
          }
        }
      }
      
      // If no logout found, use next login time as session end
      if (!sessionEndTime && nextLoginTime) {
        sessionEndTime = nextLoginTime;
      }

      // Collect all logs for this session
      const sessionLogs = sortedLogs.filter(log => {
        const logTime = new Date(log.created_at);
        return logTime >= loginTime && 
               (!sessionEndTime || logTime <= sessionEndTime);
      });

      // Calculate session metrics
      const uniquePages = new Set(
        sessionLogs.filter(log => log.path).map(log => log.path)
      ).size;

      let sessionDuration: string | undefined;
      const isActive = !logoutEvent && !nextLoginTime;
      
      if (sessionEndTime && !isActive) {
        const duration = intervalToDuration({
          start: loginTime,
          end: sessionEndTime
        });
        
        const parts = [];
        if (duration.hours) parts.push(`${duration.hours}ч`);
        if (duration.minutes) parts.push(`${duration.minutes}м`);
        if (duration.seconds && parts.length === 0) parts.push(`${duration.seconds}с`);
        sessionDuration = parts.join(' ') || '< 1м';
      }

      sessions.push({
        id: `${userId}-session-${index}`,
        user_id: userId,
        email: loginEvent.profiles?.email || 'Unknown',
        full_name: loginEvent.profiles?.full_name,
        user_type: loginEvent.profiles?.user_type,
        login_time: loginEvent.created_at,
        logout_time: logoutEvent?.created_at,
        logs: sessionLogs,
        logs_count: sessionLogs.length,
        is_active: isActive,
        session_duration: sessionDuration,
        unique_pages: uniquePages,
      });
    });
  });

  // Sort sessions by login time (newest first)
  return sessions.sort((a, b) => 
    new Date(b.login_time).getTime() - new Date(a.login_time).getTime()
  );
};

export default function ActivityMonitor() {
  // Filters state
  const [emailFilter, setEmailFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  
  const itemsPerPage = 20;

  // Toggle session expansion
  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Fetch activity logs and group by sessions
  const { data: sessionData, isLoading, isError, refetch } = useQuery({
    queryKey: ['activity-sessions', currentPage, emailFilter, eventTypeFilter, dateFromFilter, dateToFilter],
    queryFn: async () => {
      // Step 1: Get all event logs without pagination first
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
          created_at
        `)
        .eq('entity_type', 'user_activity')
        .order('created_at', { ascending: false });

      // Apply non-profile filters
      if (eventTypeFilter && eventTypeFilter !== 'all') {
        query = query.eq('action_type', eventTypeFilter);
      }

      if (dateFromFilter) {
        query = query.gte('created_at', new Date(dateFromFilter).toISOString());
      }

      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data: logs, error } = await query;

      if (error) throw error;
      if (!logs || logs.length === 0) return { data: [], count: 0 };

      // Step 2: Get unique user_ids and fetch profiles
      const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))] as string[];
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, user_type')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profiles = profilesData || [];
        }
      }

      // Step 3: Create profiles map and combine data
      const profilesMap = new Map(profiles.map(p => [p.id, p]));
      const logsWithProfiles = logs.map(log => ({
        ...log,
        profiles: log.user_id ? profilesMap.get(log.user_id) : null
      })) as ActivityLog[];

      // Step 4: Group logs by sessions
      const allSessions = groupLogsBySession(logsWithProfiles);

      // Step 5: Apply email filter to sessions
      let filteredSessions = allSessions;
      if (emailFilter) {
        filteredSessions = allSessions.filter(session => 
          session.email.toLowerCase().includes(emailFilter.toLowerCase())
        );
      }

      // Step 6: Apply pagination to sessions
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

      return { 
        data: paginatedSessions, 
        count: filteredSessions.length 
      };
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
    if (!sessionData?.count) return 1;
    return Math.ceil(sessionData.count / itemsPerPage);
  }, [sessionData?.count]);

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
              Пользовательские сессии
              {sessionData?.count && (
                <Badge variant="secondary">
                  {sessionData.count} сессий
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
                <div className="space-y-4">
                  {sessionData?.data?.map((session) => (
                  <Card key={session.id} className="border">
                    <Collapsible 
                      open={expandedSessions.has(session.id)}
                      onOpenChange={() => toggleSession(session.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {expandedSessions.has(session.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div className="flex items-center gap-2">
                                <LogIn className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-medium text-lg">
                                    {session.email}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {session.full_name || 'Имя не указано'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <div className="font-mono">
                                  {format(new Date(session.login_time), 'dd.MM.yyyy HH:mm:ss')}
                                </div>
                                <div className="text-muted-foreground">
                                  Время входа
                                </div>
                              </div>
                              {session.session_duration && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.session_duration}
                                  </div>
                                  <div className="text-muted-foreground">
                                    Длительность
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant={session.is_active ? "default" : "secondary"}>
                                  {session.is_active ? "Активна" : "Завершена"}
                                </Badge>
                                <Badge variant="outline">
                                  {session.logs_count} действий
                                </Badge>
                                <Badge variant="outline">
                                  {session.unique_pages} страниц
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="border-t pt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Время</TableHead>
                                  <TableHead>Событие</TableHead>
                                  <TableHead>Путь</TableHead>
                                  <TableHead>Метаданные</TableHead>
                                  <TableHead>IP</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {session.logs.map((log) => (
                                  <TableRow 
                                    key={log.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedLog(log)}
                                  >
                                    <TableCell className="font-mono text-sm">
                                      {format(new Date(log.created_at), 'HH:mm:ss')}
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
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
                
                {sessionData?.data?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
                </div>

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
                  <div>{selectedLog.profiles?.email || selectedLog.user_id || 'Системное событие'}</div>
                  <div className="text-muted-foreground">
                    {selectedLog.profiles?.full_name || 'N/A'} {selectedLog.profiles?.user_type ? `(${selectedLog.profiles.user_type})` : ''}
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