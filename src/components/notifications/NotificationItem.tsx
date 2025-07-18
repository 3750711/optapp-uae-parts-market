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
      return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'ORDER_STATUS_CHANGE':
      return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'PRODUCT_STATUS_CHANGE':
      return 'text-violet-700 bg-violet-100 border-violet-200';
    case 'NEW_PRODUCT':
      return 'text-indigo-700 bg-indigo-100 border-indigo-200';
    case 'ADMIN_MESSAGE':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'PRICE_OFFER':
      return 'text-teal-700 bg-teal-100 border-teal-200';
    case 'PROFILE_UPDATE':
      return 'text-slate-700 bg-slate-100 border-slate-200';
    case 'SYSTEM_MESSAGE':
      return 'text-rose-700 bg-rose-100 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
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
        "group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/60 hover:shadow-sm",
        !notification.read && "bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-l-primary shadow-sm"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn(
        "p-3 rounded-xl flex-shrink-0 border shadow-sm transition-all duration-200 group-hover:shadow-md", 
        getNotificationColor(notification.type)
      )}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "text-sm font-medium leading-tight text-foreground mb-1",
              !notification.read && "font-semibold text-primary"
            )}>
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: ru 
                })}
              </p>
              {!notification.read && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Новое
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                onClick={handleMarkAsRead}
                title="Отметить как прочитанное"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
              onClick={handleDelete}
              title="Удалить уведомление"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};