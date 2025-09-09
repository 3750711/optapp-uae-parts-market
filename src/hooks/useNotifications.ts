import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FLAGS } from '@/config/flags';
import { useLanguage } from '@/hooks/useLanguage';
import { Notification } from '@/types/notification';
import { toast } from '@/hooks/use-toast';
import { getNotificationTranslations } from '@/utils/notificationTranslations';

export const useNotifications = () => {
  const { status, user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize unread count calculation to avoid recalculation on every render
  const memoizedUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const { language } = useLanguage();
  
  // Get translations based on language
  const translations = useMemo(() => {
    return getNotificationTranslations(language);
  }, [language]);

  // Optimized fetch notifications with better query
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[useNotifications] Fetching notifications for user:', user.id);
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
      console.warn('[useNotifications] network/CORS?', error);
      setNotifications([]); // Critical: return empty array, don't crash UI
    } finally {
      setLoading(false);
    }
  }, [user, profile?.user_type, translations]);

  // Optimized mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('❌ [useNotifications] Error marking notification as read:', error);
    }
  }, [user?.id]);

  // Optimized mark all as read
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
      console.error('❌ [useNotifications] Error marking all notifications as read:', error);
    }
  }, [user]);

  // Optimized delete notification
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
      console.error('❌ [useNotifications] Error deleting notification:', error);
    }
  }, [user?.id]);

  // Single channel ref to prevent duplicates
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Manual refresh function for notifications
  const refreshNotifications = () => {
    if (user?.id) {
      fetchNotifications();
    }
  };

  // Optional: Set up periodic refresh (every 30 seconds) for critical notifications  
  useEffect(() => {
    if (status !== 'authed' || !user?.id) {
      setLoading(false);
      return;
    }
    
    // Initial fetch
    fetchNotifications();

    // Set up interval for periodic refresh
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [status, user?.id]);

  return {
    notifications,
    unreadCount: memoizedUnreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };
};