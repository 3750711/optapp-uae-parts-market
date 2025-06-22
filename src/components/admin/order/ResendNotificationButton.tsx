
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useOrderResendNotification } from '@/hooks/useOrderResendNotification';

interface ResendNotificationButtonProps {
  orderId: string;
  onSuccess?: () => void;
}

const ResendNotificationButton: React.FC<ResendNotificationButtonProps> = ({
  orderId,
  onSuccess
}) => {
  const { isAdmin, user } = useAuth();
  const { resendNotification, isResending, shouldShowButton } = useOrderResendNotification({
    orderId,
    onSuccess
  });

  // Only admins can resend notifications
  if (!isAdmin || !shouldShowButton) {
    return null;
  }

  const handleResend = async () => {
    await resendNotification();
  };

  return (
    <Button
      onClick={handleResend}
      disabled={isResending}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      {isResending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      <span>{isResending ? 'Отправка...' : 'Повторить уведомление'}</span>
    </Button>
  );
};

export default ResendNotificationButton;
