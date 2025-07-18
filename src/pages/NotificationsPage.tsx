import React, { useState } from 'react';
import { Bell, Filter, CheckCheck, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (showOnlyUnread && notification.read) return false;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Вчера';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = 'На этой неделе';
    } else {
      groupKey = 'Ранее';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'NEW_ORDER': return 'Новые заказы';
      case 'ORDER_STATUS_CHANGE': return 'Статус заказов';
      case 'PRODUCT_STATUS_CHANGE': return 'Статус товаров';
      case 'NEW_PRODUCT': return 'Новые товары';
      case 'ADMIN_MESSAGE': return 'Сообщения администратора';
      case 'PRICE_OFFER': return 'Предложения цены';
      case 'PROFILE_UPDATE': return 'Обновления профиля';
      case 'SYSTEM_MESSAGE': return 'Системные сообщения';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка уведомлений...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Уведомления</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Прочитать все
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Тип:</label>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as NotificationType | 'all')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="NEW_ORDER">Новые заказы</SelectItem>
                  <SelectItem value="ORDER_STATUS_CHANGE">Статус заказов</SelectItem>
                  <SelectItem value="PRODUCT_STATUS_CHANGE">Статус товаров</SelectItem>
                  <SelectItem value="PRICE_OFFER">Предложения цены</SelectItem>
                  <SelectItem value="ADMIN_MESSAGE">Сообщения администратора</SelectItem>
                  <SelectItem value="PROFILE_UPDATE">Обновления профиля</SelectItem>
                  <SelectItem value="SYSTEM_MESSAGE">Системные сообщения</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant={showOnlyUnread ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className="gap-2"
            >
              Только непрочитанные
              {showOnlyUnread && (
                <Badge variant="secondary" className="ml-1">
                  {filteredNotifications.filter(n => !n.read).length}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {Object.keys(groupedNotifications).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Уведомления не найдены</h3>
              <p className="text-muted-foreground">
                {filterType !== 'all' || showOnlyUnread 
                  ? 'Попробуйте изменить фильтры или очистить их'
                  : 'У вас пока нет уведомлений'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey}>
              <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                {groupKey}
                <Badge variant="secondary" className="text-xs">
                  {groupNotifications.length}
                </Badge>
              </h2>
              
              <Card>
                <CardContent className="p-0">
                  {groupNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className="p-2">
                        <NotificationItem
                          notification={notification}
                          onClose={() => {}} // No close needed on full page
                        />
                      </div>
                      {index < groupNotifications.length - 1 && (
                        <div className="border-b border-border/50 mx-6" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;