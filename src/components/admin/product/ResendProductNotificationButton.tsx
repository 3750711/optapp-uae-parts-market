import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelegramNotification } from '@/hooks/useTelegramNotification';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ResendProductNotificationButtonProps {
  productId: string;
  className?: string;
}

export const ResendProductNotificationButton = ({ 
  productId, 
  className = '' 
}: ResendProductNotificationButtonProps) => {
  const [isResending, setIsResending] = useState(false);
  const { sendProductNotification } = useTelegramNotification();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Только админы могут отправлять
  if (profile?.user_type !== 'admin') return null;

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResending(true);
    
    try {
      await sendProductNotification(productId, 'product_published');
      
      // Инвалидируем кэш (включая with-issues)
      queryClient.invalidateQueries({ 
        queryKey: ['admin-products'],
        exact: false 
      });
      
      toast.success('Уведомление отправлено в Telegram');
    } catch (error) {
      console.error('Error resending notification:', error);
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
