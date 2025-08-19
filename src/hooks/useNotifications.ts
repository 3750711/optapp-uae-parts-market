
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/notification';
import { toast } from '@/hooks/use-toast';
import { getNotificationTranslations } from '@/utils/notificationTranslations';

export const useNotifications = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize unread count calculation to avoid recalculation on every render
  const memoizedUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Get translations based on user type
  const translations = useMemo(() => {
    return getNotificationTranslations(profile?.user_type || 'buyer');
  }, [profile?.user_type]);

  // Optimized fetch notifications with better query
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔍 [useNotifications] Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, title_en, message_en, language, data, read, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30); // Reduced limit for better performance

      if (error) throw error;

      console.log('🔍 [useNotifications] Notifications fetched:', data?.length || 0);

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
      console.error('❌ [useNotifications] Error fetching notifications:', error);
      const errorTitle = profile?.user_type === 'seller' ? 'Error' : 'Ошибка';
      const errorDesc = profile?.user_type === 'seller' ? 'Failed to load notifications' : 'Не удалось загрузить уведомления';
      
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive"
      });
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

  // ВРЕМЕННО ОТКЛЮЧЕНО: Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('🔍 [useNotifications] Setting up for user:', user.id);
    
    // Только базовая загрузка без Realtime подписок
    fetchNotifications();
    
    // REALTIME ВРЕМЕННО ОТКЛЮЧЕН ДЛЯ ДИАГНОСТИКИ
    console.log('⚠️ [useNotifications] Realtime subscriptions disabled for diagnostics');
    
    /*
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // ... realtime logic
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // ... realtime logic
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */
  }, [user, fetchNotifications]); // Убрали зависимости от profile и translations

  console.log('🔍 [useNotifications] Hook execution complete');

  return {
    notifications,
    unreadCount: memoizedUnreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};
