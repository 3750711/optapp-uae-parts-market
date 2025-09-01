
import { useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { getNotificationTranslations } from '@/utils/notificationTranslations';

export const useNotifications = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { 
    notifications: rawNotifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification,
    connectionState
  } = useRealtime();
  
  // Get translations based on language
  const translations = useMemo(() => {
    return getNotificationTranslations(language);
  }, [language]);

  // Process notifications to show correct language based on user type
  const notifications = useMemo(() => {
    return rawNotifications.map(notification => {
      const userType = profile?.user_type || 'buyer';
      const isSellerViewingEnglish = userType === 'seller';
      
      return {
        ...notification,
        title: isSellerViewingEnglish && notification.title_en 
          ? notification.title_en 
          : notification.title || translations.notificationTitles[notification.type as keyof typeof translations.notificationTitles] || 'Notification',
        message: isSellerViewingEnglish && notification.message_en 
          ? notification.message_en 
          : notification.message || translations.notificationMessages[notification.type as keyof typeof translations.notificationMessages]?.(notification.data) || ''
      };
    });
  }, [rawNotifications, profile?.user_type, translations]);

  return {
    notifications,
    unreadCount,
    loading: connectionState === 'connecting',
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification,
    refetch: () => {} // No-op since RealtimeProvider handles refreshing
  };
};
