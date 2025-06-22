import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface UseOrderResendNotificationProps {
  orderId: string;
  onSuccess?: () => void;
}

export const useOrderResendNotification = ({ orderId, onSuccess }: UseOrderResendNotificationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  // Отслеживаем данные заказа из кэша для мгновенного обновления
  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('seller_id, is_modified')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user && !!profile,
    staleTime: 30000, // 30 секунд
  });

  const checkShouldShowButton = async () => {
    if (!orderId || !user || !profile) return false;

    try {
      // Используем данные из кэша если доступны, иначе загружаем
      let order = orderData;
      
      if (!order) {
        const { data, error } = await supabase
          .from('orders')
          .select('seller_id, is_modified')
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          return false;
        }
        order = data;
      }

      // Проверяем права пользователя
      const isAdmin = profile.user_type === 'admin';
      const canResend = isAdmin || order.seller_id === user.id;
      
      // Показываем кнопку только если есть права и заказ изменен
      const shouldShow = canResend && (order.is_modified === true);
      
      setShouldShowButton(shouldShow);
      return shouldShow;
    } catch (error) {
      console.error('Error in checkShouldShowButton:', error);
      return false;
    }
  };

  // Автоматически обновляем видимость кнопки при изменении данных заказа
  useEffect(() => {
    if (orderData && user && profile) {
      const isAdmin = profile.user_type === 'admin';
      const canResend = isAdmin || orderData.seller_id === user.id;
      const shouldShow = canResend && (orderData.is_modified === true);
      setShouldShowButton(shouldShow);
    }
  }, [orderData, user, profile]);

  const resendNotification = async () => {
    if (!orderId) {
      console.error('Order ID is required');
      return false;
    }

    setIsResending(true);
    try {
      console.log('🔄 Resending notification for order:', orderId);

      // Сначала обновляем метки в БД
      const { data: resendResult, error: resendError } = await supabase.rpc('resend_order_notification', {
        p_order_id: orderId
      });

      if (resendError) {
        console.error('❌ Error updating resend notification data:', resendError);
        toast({
          title: "Ошибка обновления",
          description: "Не удалось обновить данные уведомления",
          variant: "destructive",
        });
        return false;
      }

      // Получаем полные данные заказа для отправки
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram,
            full_name,
            opt_id
          ),
          seller:profiles!orders_seller_id_fkey (
            telegram,
            full_name,
            opt_id
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('❌ Error fetching order data:', orderError);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные заказа",
          variant: "destructive",
        });
        return false;
      }

      // Отправляем уведомление через edge-функцию
      const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          order: {
            ...orderData,
            seller_opt_id: orderData.seller?.opt_id,
            buyer_opt_id: orderData.buyer?.opt_id,
            telegram_url_order: orderData.seller?.telegram,
            telegram_url_buyer: orderData.buyer?.telegram
          },
          action: 'resend'
        }
      });

      if (notificationError) {
        console.error('❌ Error sending notification:', notificationError);
        toast({
          title: "Ошибка отправки",
          description: "Не удалось отправить уведомление в Telegram",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Notification resent successfully');
      toast({
        title: "Уведомление отправлено",
        description: "Уведомление о заказе повторно отправлено в Telegram",
      });

      // Оптимистично обновляем кэш - скрываем кнопку
      queryClient.setQueryData(['order', orderId], (oldOrder: any) => {
        if (!oldOrder) return oldOrder;
        return { ...oldOrder, is_modified: false };
      });

      // Обновляем состояние кнопки
      setShouldShowButton(false);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('❌ Error in resendNotification:', error);
      toast({
        title: "Ошибка отправки",
        description: "Произошла ошибка при повторной отправке уведомления",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsResending(false);
    }
  };

  return {
    resendNotification,
    isResending,
    shouldShowButton,
    checkShouldShowButton
  };
};
