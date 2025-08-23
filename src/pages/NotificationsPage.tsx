import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getNotificationTranslations, getNotificationLocale } from '@/utils/notificationTranslations';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  const { language } = useLanguage();
  
  // Get translations based on user language
  const translations = useMemo(() => {
    return getNotificationTranslations(language);
  }, [language]);

  // Get locale for date formatting
  const locale = useMemo(() => {
    return getNotificationLocale(language) === 'en' ? enUS : ru;
  }, [language]);

  // Memoized grouped notifications to prevent recalculation on every render
  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = translations.today;
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = translations.yesterday;
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = translations.thisWeek;
      } else {
        groupKey = translations.earlier;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
      return groups;
    }, {} as Record<string, typeof notifications>);
  }, [notifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
          {/* Back Button Skeleton */}
          <div className="mb-4 md:mb-6">
            <Skeleton className="h-10 w-20" />
          </div>
          
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Notifications Skeleton */}
          <div className="space-y-6 md:space-y-8">
            {Array.from({ length: 3 }).map((_, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="p-3 md:p-4">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <div className="flex gap-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
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
            <span className="hidden sm:inline">{translations.backButton}</span>
          </Button>
        </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{translations.pageTitle}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {translations.unreadCount(unreadCount)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="gap-2 text-sm">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{translations.markAllAsRead}</span>
              <span className="sm:hidden">{translations.markAllShort}</span>
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
              <h3 className="text-lg font-semibold mb-2">{translations.noNotifications}</h3>
              <p className="text-muted-foreground">
                {translations.noNotificationsDesc}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey}>
              {/* Mobile: Simple section header */}
              <div className="md:hidden">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1 flex items-center gap-2">
                  {groupKey}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {groupNotifications.length}
                  </Badge>
                </h2>
                <div className="space-y-1.5">
                  {groupNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClose={() => {}}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: Card layout */}
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  {groupKey}
                  <Badge variant="secondary" className="text-xs">
                    {groupNotifications.length}
                  </Badge>
                </h2>
                
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {groupNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div className="p-3">
                          <NotificationItem
                            notification={notification}
                            onClose={() => {}}
                          />
                        </div>
                        {index < groupNotifications.length - 1 && (
                          <div className="border-b border-border/50 mx-3" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default NotificationsPage;