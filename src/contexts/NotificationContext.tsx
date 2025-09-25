import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FLAGS } from '@/config/flags';
import { useLanguage } from '@/hooks/useLanguage';
import { Notification } from '@/types/notification';
import { getNotificationTranslations } from '@/utils/notificationTranslations';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get translations based on language
  const translations = useMemo(() => {
    return getNotificationTranslations(language);
  }, [language]);

  // Memoize unread count calculation
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[NotificationContext] Fetching notifications for user:', user.id);
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, title_en, message_en, language, data, read, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Process notifications to show correct language based on user type
      const processedNotifications = (data || []).map(notification => {
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

      setNotifications(processedNotifications);
    } catch (error) {
      console.warn('[NotificationContext] network/CORS?', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.user_type, translations]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('❌ [NotificationContext] Error marking notification as read:', error);
    }
  }, [user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('❌ [NotificationContext] Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('❌ [NotificationContext] Error deleting notification:', error);
    }
  }, [user?.id]);

  // Manual refresh function
  const refreshNotifications = useCallback(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [fetchNotifications, user?.id]);

  // Setup controlled polling with cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status !== 'authed' || !user?.id) {
      setLoading(false);
      return;
    }
    
    // Initial fetch
    fetchNotifications();

    // Set up SINGLE controlled interval
    intervalRef.current = setInterval(() => {
      console.debug('[NotificationContext] Polling notifications...');
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, user?.id, fetchNotifications]);

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }), [notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refreshNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};