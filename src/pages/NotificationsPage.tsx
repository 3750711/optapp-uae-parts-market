import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Header from '@/components/layout/Header';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка уведомлений...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary p-2 md:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
        </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Уведомления</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="gap-2 text-sm">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Прочитать все</span>
              <span className="sm:hidden">Все</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {Object.keys(groupedNotifications).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Уведомления не найдены</h3>
              <p className="text-muted-foreground">
                У вас пока нет уведомлений
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey}>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-foreground flex items-center gap-2">
                {groupKey}
                <Badge variant="secondary" className="text-xs">
                  {groupNotifications.length}
                </Badge>
              </h2>
              
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {groupNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className="p-3 md:p-4">
                        <NotificationItem
                          notification={notification}
                          onClose={() => {}} // No close needed on full page
                        />
                      </div>
                      {index < groupNotifications.length - 1 && (
                        <div className="border-b border-border/50 mx-3 md:mx-6" />
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
    </div>
  );
};

export default NotificationsPage;