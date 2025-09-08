
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
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

  const { language } = useLanguage();
  
  // Get translations based on language
  const translations = useMemo(() => {
    return getNotificationTranslations(language);
  }, [language]);

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

  // Single channel ref to prevent duplicates
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Setup real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) return;

    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.log('🔍 [useNotifications] Setting up realtime for user:', user.id);
    }
    
    // Initial fetch
    fetchNotifications();

    // Close old channel if exists
    if (channelRef.current) {
      try { 
        channelRef.current.unsubscribe(); 
      } catch (error) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[useNotifications] Old channel cleanup error:', error);
        }
      }
      channelRef.current = null;
    }

    // Create single channel per user
    const channel = supabase.channel(`notifications:${user.id}`);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.log('📢 [useNotifications] New notification received:', payload.new);
          }
          
          // Process new notification with language logic
          const notification = payload.new as Notification;
          const userType = profile?.user_type || 'buyer';
          const isSellerViewingEnglish = userType === 'seller';
          
          const processedNotification = {
            ...notification,
            title: isSellerViewingEnglish && notification.title_en 
              ? notification.title_en 
              : notification.title || translations.notificationTitles[notification.type as keyof typeof translations.notificationTitles] || 'Notification',
            message: isSellerViewingEnglish && notification.message_en 
              ? notification.message_en 
              : notification.message || translations.notificationMessages[notification.type as keyof typeof translations.notificationMessages]?.(notification.data) || ''
          };
          
          // Add new notification to the top of the list
          setNotifications(prev => [processedNotification, ...prev]);
          
          // Show toast notification
          const toastTitle = isSellerViewingEnglish ? 'New notification' : 'Новое уведомление';
          toast({
            title: toastTitle,
            description: processedNotification.title,
          });
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
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.log('🔄 [useNotifications] Notification updated:', payload.new);
          }
          
          // Update existing notification in state
          const updatedNotification = payload.new as Notification;
          const userType = profile?.user_type || 'buyer';
          const isSellerViewingEnglish = userType === 'seller';
          
          const processedNotification = {
            ...updatedNotification,
            title: isSellerViewingEnglish && updatedNotification.title_en 
              ? updatedNotification.title_en 
              : updatedNotification.title || translations.notificationTitles[updatedNotification.type as keyof typeof translations.notificationTitles] || 'Notification',
            message: isSellerViewingEnglish && updatedNotification.message_en 
              ? updatedNotification.message_en 
              : updatedNotification.message || translations.notificationMessages[updatedNotification.type as keyof typeof translations.notificationMessages]?.(updatedNotification.data) || ''
          };
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? processedNotification : n)
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && (window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.log('✅ [useNotifications] Realtime channel subscribed');
        }
      });

    return () => {
      if (channelRef.current) {
        try { 
          channelRef.current.unsubscribe(); 
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[useNotifications] Channel cleanup error:', error);
          }
        }
        channelRef.current = null;
      }
    };
  }, [user?.id, profile?.user_type]); // Optimized dependencies

  if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
    console.log('🔍 [useNotifications] Hook execution complete');
  }

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
