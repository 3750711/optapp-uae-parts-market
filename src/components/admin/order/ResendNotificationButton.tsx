
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useOrderResendNotification } from '@/hooks/useOrderResendNotification';
import { useProfile } from '@/contexts/ProfileProvider';

interface ResendNotificationButtonProps {
  orderId: string;
  onSuccess?: () => void;
  size?: 'sm' | 'icon' | 'default';
  variant?: 'outline' | 'ghost' | 'default';
  className?: string;
}

export const ResendNotificationButton: React.FC<ResendNotificationButtonProps> = ({
  orderId,
  onSuccess,
  size = 'icon',
  variant = 'ghost',
  className = ''
}) => {
  const { profile } = useProfile();
  const { 
    resendNotification, 
    isResending, 
    shouldShowButton, 
    checkShouldShowButton 
  } = useOrderResendNotification({ 
    orderId, 
    onSuccess 
  });

  // Проверяем, нужно ли показывать кнопку при загрузке компонента
  useEffect(() => {
    checkShouldShowButton();
  }, [orderId]);

  // Проверяем права пользователя (только админы и продавцы)
  const canResend = profile?.user_type === 'admin' || profile?.user_type === 'seller';

  // Не показываем кнопку если нет прав или она не нужна
  if (!canResend || !shouldShowButton) {
    return null;
  }

  const handleResend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await resendNotification();
  };

  return (
    <Button
      onClick={handleResend}
      disabled={isResending}
      size={size}
      variant={variant}
      className={`text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors ${className}`}
      title="Повторно отправить уведомление (данные изменились)"
    >
      <RefreshCw className={`${isResending ? 'animate-spin' : ''} ${size === 'icon' ? 'h-4 w-4' : 'h-3 w-3 mr-1'}`} />
      {size !== 'icon' && 'Повторить'}
    </Button>
  );
};
