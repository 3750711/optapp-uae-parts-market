import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Search, MessageSquare, Users, AlertCircle, CheckCircle, Clock, BarChart3, RefreshCw, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTelegramNotifications, useTelegramNotificationStats, TelegramNotificationFilters, TelegramNotificationLog } from '@/hooks/useTelegramNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminTelegramMonitoring = () => {
  const [filters, setFilters] = useState<TelegramNotificationFilters>({});
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<TelegramNotificationLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTesting, setIsTesting] = useState(false);
 
  const { data: notifications, isLoading, refetch } = useTelegramNotifications(filters, page, 50);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useTelegramNotificationStats();

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('telegram-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telegram_notifications_log'
        },
        () => {
          refetch();
          refetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchStats]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof TelegramNotificationFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value 
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(1);
  };
 
  const handleSendTest = async () => {
    try {
      setIsTesting(true);
      const { error } = await supabase.functions.invoke('test-telegram-monitoring');
      if (error) throw error;
      toast.success('Тестовые уведомления отправлены');
      await Promise.all([refetch(), refetchStats()]);
    } catch (err) {
      console.error('Test send error:', err);
      toast.error('Ошибка при отправке тестовых уведомлений');
    } finally {
      setIsTesting(false);
    }
  };
 
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRecipientTypeIcon = (type: string) => {
    return type === 'group' ? <Users className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  const formatMessage = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (statsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader title="Мониторинг Telegram уведомлений" />
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего отправлено</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Успешно</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total ? Math.round((stats.sent / stats.total) * 100) : 0}% успешности
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total ? Math.round((stats.failed / stats.total) * 100) : 0}% ошибок
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.today || 0}</div>
              <p className="text-xs text-muted-foreground">За сегодня</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Фильтры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Поиск по содержимому..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} variant="outline" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Select value={filters.function_name || 'all'} onValueChange={(value) => handleFilterChange('function_name', value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Функция" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все функции</SelectItem>
                      <SelectItem value="send-telegram-notification">send-telegram-notification</SelectItem>
                      <SelectItem value="notify-seller-product-sold">notify-seller-product-sold</SelectItem>
                      <SelectItem value="notify-seller-new-price-offer">notify-seller-new-price-offer</SelectItem>
                      <SelectItem value="notify-admins-new-product">notify-admins-new-product</SelectItem>
                      <SelectItem value="send-bulk-telegram-messages">send-bulk-telegram-messages</SelectItem>
                      <SelectItem value="notify-user-verification-status">notify-user-verification-status</SelectItem>
                      <SelectItem value="notify-user-welcome-registration">notify-user-welcome-registration</SelectItem>
                      <SelectItem value="notify-admins-new-user">notify-admins-new-user</SelectItem>
                      <SelectItem value="telegram-widget-auth">telegram-widget-auth</SelectItem>
                      <SelectItem value="test-telegram-monitoring">test-telegram-monitoring</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="sent">Отправлено</SelectItem>
                      <SelectItem value="failed">Ошибка</SelectItem>
                      <SelectItem value="pending">Ожидание</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.recipient_type || 'all'} onValueChange={(value) => handleFilterChange('recipient_type', value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Тип получателя" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="personal">Личные</SelectItem>
                      <SelectItem value="group">Группы</SelectItem>
                    </SelectContent>
                  </Select>

                  
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Обновить
                  </Button>
                  <Button onClick={handleSendTest} size="sm" disabled={isTesting}>
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Отправить тест
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Список уведомлений {notifications?.count ? `(${notifications.count})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Время</TableHead>
                        <TableHead>Функция</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Получатель</TableHead>
                        <TableHead>Сообщение</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications?.data?.map((notification) => (
                        <TableRow 
                          key={notification.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <TableCell className="font-mono text-sm">
                            {format(new Date(notification.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {notification.function_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRecipientTypeIcon(notification.recipient_type)}
                              {notification.notification_type}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {notification.recipient_name || notification.recipient_identifier}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {notification.recipient_type === 'group' ? 'Группа' : 'Личное'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="truncate text-sm">
                              {formatMessage(notification.message_text)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(notification.status)}
                              <Badge variant={getStatusBadgeVariant(notification.status)}>
                                {notification.status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {notifications?.hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={() => setPage(prev => prev + 1)}
                      variant="outline"
                      disabled={isLoading}
                    >
                      Загрузить еще
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Топ функций (за неделю)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.functions?.map((func, index) => (
                      <div key={func.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm font-medium">{func.name}</span>
                        </div>
                        <Badge>{func.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Типы уведомлений</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.types?.map((type, index) => (
                      <div key={type.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm font-medium">{type.type}</span>
                        </div>
                        <Badge variant="secondary">{type.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Notification Details Dialog */}
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детали уведомления</DialogTitle>
            </DialogHeader>
            {selectedNotification && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Время отправки</label>
                    <div className="font-mono text-sm">
                      {format(new Date(selectedNotification.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Функция</label>
                    <div><Badge>{selectedNotification.function_name}</Badge></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Тип уведомления</label>
                    <div>{selectedNotification.notification_type}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Статус</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedNotification.status)}
                      <Badge variant={getStatusBadgeVariant(selectedNotification.status)}>
                        {selectedNotification.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Получатель</label>
                    <div>
                      <div className="flex items-center gap-2">
                        {getRecipientTypeIcon(selectedNotification.recipient_type)}
                        {selectedNotification.recipient_name || selectedNotification.recipient_identifier}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedNotification.recipient_type === 'group' ? 'Группа' : 'Личное сообщение'}
                      </div>
                    </div>
                  </div>
                  {selectedNotification.telegram_message_id && (
                    <div>
                      <label className="text-sm font-medium">ID сообщения в Telegram</label>
                      <div className="font-mono text-sm">{selectedNotification.telegram_message_id}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Содержимое сообщения</label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {selectedNotification.message_text}
                  </div>
                </div>

                {selectedNotification.error_details && (
                  <div>
                    <label className="text-sm font-medium text-red-600">Детали ошибки</label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                      <pre className="whitespace-pre-wrap text-red-700">
                        {JSON.stringify(selectedNotification.error_details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Метаданные</label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(selectedNotification.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTelegramMonitoring;