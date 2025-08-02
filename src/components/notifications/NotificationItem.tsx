import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { getNotificationTranslations, getNotificationLocale } from '@/utils/notificationTranslations';
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

const NotificationItemComponent = ({ notification, onClose }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const translations = getNotificationTranslations(profile?.user_type || 'buyer');
  const locale = getNotificationLocale(profile?.user_type || 'buyer') === 'en' ? enUS : ru;

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
        "group cursor-pointer transition-all duration-200 touch-manipulation",
        // Mobile: compact card design
        "p-2.5 md:p-3 rounded-lg md:rounded-xl border bg-card hover:bg-accent/40",
        // Unread styling
        !notification.read && "bg-gradient-to-r from-primary/5 to-primary/8 border-primary/20 shadow-sm"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2.5 md:gap-3">
        {/* Icon */}
        <div className={cn(
          "p-1.5 md:p-2 rounded-lg flex-shrink-0 border transition-all duration-200", 
          getNotificationColor(notification.type)
        )}>
          <div className="h-3.5 w-3.5 md:h-4 md:w-4">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-sm font-medium leading-tight text-foreground",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              {notification.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
              )}
            </div>

            {/* Unread indicator for mobile */}
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1 md:hidden" />
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale 
                })}
              </p>
              {!notification.read && (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {translations.newLabel}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                  onClick={handleMarkAsRead}
                  title={translations.markAsRead}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                onClick={handleDelete}
                title={translations.deleteNotification}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const NotificationItem = memo(NotificationItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.read === nextProps.notification.read &&
    prevProps.notification.updated_at === nextProps.notification.updated_at
  );
});