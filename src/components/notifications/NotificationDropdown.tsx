import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
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
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Загрузка уведомлений...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Нет уведомлений</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-base">Уведомления</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs h-8 px-2 hover:bg-accent"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        <div className="p-2">
          {notifications.map((notification, index) => (
            <div key={notification.id}>
              <NotificationItem 
                notification={notification} 
                onClose={onClose}
              />
              {index < notifications.length - 1 && (
                <Separator className="my-1" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-xs h-8"
          onClick={() => {
            // TODO: Navigate to notifications page
            onClose();
          }}
        >
          Показать все уведомления
        </Button>
      </div>
    </div>
  );
};