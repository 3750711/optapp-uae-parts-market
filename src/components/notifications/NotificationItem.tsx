import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ShoppingCart, 
  Package, 
  MessageSquare, 
  DollarSign, 
  User, 
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notification';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'NEW_ORDER':
      return <ShoppingCart className="h-4 w-4" />;
    case 'ORDER_STATUS_CHANGE':
      return <Package className="h-4 w-4" />;
    case 'PRODUCT_STATUS_CHANGE':
      return <Package className="h-4 w-4" />;
    case 'NEW_PRODUCT':
      return <Package className="h-4 w-4" />;
    case 'ADMIN_MESSAGE':
      return <MessageSquare className="h-4 w-4" />;
    case 'PRICE_OFFER':
      return <DollarSign className="h-4 w-4" />;
    case 'PROFILE_UPDATE':
      return <User className="h-4 w-4" />;
    case 'SYSTEM_MESSAGE':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'NEW_ORDER':
      return 'text-green-600 bg-green-50';
    case 'ORDER_STATUS_CHANGE':
      return 'text-blue-600 bg-blue-50';
    case 'PRODUCT_STATUS_CHANGE':
      return 'text-purple-600 bg-purple-50';
    case 'NEW_PRODUCT':
      return 'text-indigo-600 bg-indigo-50';
    case 'ADMIN_MESSAGE':
      return 'text-orange-600 bg-orange-50';
    case 'PRICE_OFFER':
      return 'text-emerald-600 bg-emerald-50';
    case 'PROFILE_UPDATE':
      return 'text-gray-600 bg-gray-50';
    case 'SYSTEM_MESSAGE':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    const { data } = notification;
    
    if (data.url) {
      navigate(data.url);
    } else if (data.order_id) {
      navigate(`/orders/${data.order_id}`);
    } else if (data.product_id) {
      navigate(`/product/${data.product_id}`);
    }

    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50",
        !notification.read && "bg-blue-50/50 border-l-2 border-l-blue-500"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-full flex-shrink-0", getNotificationColor(notification.type))}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium leading-tight",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true, 
                locale: ru 
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={handleMarkAsRead}
                title="Отметить как прочитанное"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
              title="Удалить уведомление"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );
};