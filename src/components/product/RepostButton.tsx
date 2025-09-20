import React from 'react';
import { Button } from "@/components/ui/button";
import { useProductRepost } from "@/hooks/useProductRepost";

interface RepostButtonProps {
  productId: string;
  lastNotificationSentAt?: string | null;
  status: string;
  sellerId: string;
  onRepostSuccess?: () => void;
}

export const RepostButton: React.FC<RepostButtonProps> = ({
  productId,
  lastNotificationSentAt,
  status,
  sellerId,
  onRepostSuccess
}) => {
  const { checkCanRepost, sendRepost, isReposting, queuedReposts } = useProductRepost();

  // Only show for active products
  if (status !== 'active') {
    return null;
  }

  const { canRepost, hoursLeft } = checkCanRepost(lastNotificationSentAt);
  const isLoading = isReposting[productId] || false;
  const isQueued = !!queuedReposts[productId];

  const handleRepost = async () => {
    if (!canRepost || isLoading || isQueued) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Отправить репост товара в Telegram группу?\n\nПосле отправки следующий репост будет доступен через 72 часа.`
    );
    
    if (!confirmed) return;
    
    const success = await sendRepost(productId);
    if (success && onRepostSuccess) {
      onRepostSuccess();
    }
  };

  if (!canRepost) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium"
      >
        Через {hoursLeft}ч
      </Button>
    );
  }

  // Show queued status
  if (isQueued) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium bg-blue-50 border-blue-200 text-blue-600"
      >
        В очереди
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRepost}
      disabled={isLoading || isQueued}
      className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium hover:bg-blue-50 hover:border-blue-300"
    >
      {isLoading ? 'Добавление...' : 'Репост'}
    </Button>
  );
};