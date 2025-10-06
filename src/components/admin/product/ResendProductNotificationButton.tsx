import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ResendProductNotificationButtonProps {
  productId: string;
  className?: string;
}

export const ResendProductNotificationButton = ({ 
  productId, 
  className = '' 
}: ResendProductNotificationButtonProps) => {
  const [isResending, setIsResending] = useState(false);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Только админы могут отправлять
  if (profile?.user_type !== 'admin') return null;

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResending(true);
    
    try {
      console.log('🔄 Step 1: Updating last_notification_sent_at via RPC');
      
      // Step 1: Update database timestamp
      const { data: rpcData, error: rpcError } = await supabase.rpc('resend_product_notification', {
        p_product_id: productId
      });

      if (rpcError) {
        console.error('❌ RPC error:', rpcError);
        throw rpcError;
      }

      if (!rpcData?.success) {
        throw new Error(rpcData?.error || 'Failed to update timestamp');
      }

      console.log('✅ Step 1 complete: Timestamp updated');
      console.log('🔄 Step 2: Sending Telegram notification via Edge Function');

      // Step 2: Send Telegram notification
      const { data: notificationData, error: notificationError } = await supabase.functions.invoke(
        'send-telegram-notification',
        {
          body: {
            productId: productId,
            notificationType: 'product_published'
          }
        }
      );

      if (notificationError) {
        console.error('❌ Edge Function error:', notificationError);
        throw notificationError;
      }

      console.log('✅ Step 2 complete: Telegram notification sent', notificationData);
      
      // Invalidate cache
      queryClient.invalidateQueries({ 
        queryKey: ['admin-products'],
        exact: false 
      });
      
      toast.success('Уведомление отправлено в Telegram');
    } catch (error) {
      console.error('❌ Error resending notification:', error);
      toast.error('Ошибка отправки уведомления');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative">
      {/* Пульсирующий фон за кнопкой */}
      <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75 pointer-events-none" />
      
      {/* Сама кнопка */}
      <Button
        onClick={handleResend}
        disabled={isResending}
        size="icon"
        variant="ghost"
        className={`relative h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg ${className}`}
        aria-label="Отправить уведомление повторно"
      >
        <RefreshCw 
          className={`h-3 w-3 sm:h-4 sm:w-4 ${isResending ? 'animate-spin' : ''}`} 
        />
      </Button>
    </div>
  );
};
