import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getNotificationTranslations } from '@/utils/notificationTranslations';
import { CheckCheck, Trash2, Eye, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();
  const translations = getNotificationTranslations(language);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {translations.loading}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>{translations.noNotifications}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-background via-background to-background/95">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg text-foreground">{translations.pageTitle}</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm h-9 px-3 hover:bg-accent/80 transition-colors duration-200 text-primary hover:text-primary"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {translations.markAllAsRead}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[500px]">
        <div className="p-2">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id}
              className="group hover:bg-accent/30 transition-colors duration-200 rounded-lg"
            >
              <NotificationItem 
                notification={notification} 
                onClose={onClose}
              />
              {index < notifications.length - 1 && (
                <Separator className="my-2 opacity-50" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator className="opacity-30" />
      <div className="p-4 bg-gradient-to-t from-muted/20 to-background">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sm h-10 hover:bg-accent/60 transition-all duration-200 font-medium text-primary"
          onClick={() => {
            window.location.href = '/notifications';
            onClose();
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          {translations.showAll}
        </Button>
      </div>
    </div>
  );
};