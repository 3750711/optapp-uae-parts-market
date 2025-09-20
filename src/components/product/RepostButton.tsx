import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock } from "lucide-react";
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
        className="w-full mt-2 text-xs"
      >
        <Clock className="h-3 w-3 mr-1" />
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
        className="w-full mt-2 text-xs bg-blue-50 border-blue-200 text-blue-600"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
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
      className="w-full mt-2 text-xs hover:bg-blue-50 hover:border-blue-300"
    >
      {isLoading ? (
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <>📢</>
      )}
      {isLoading ? 'Добавление...' : 'Репост'}
    </Button>
  );
};