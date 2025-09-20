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
  const { checkCanRepost, sendRepost, isReposting } = useProductRepost();

  // Only show for active products
  if (status !== 'active') {
    return null;
  }

  const { canRepost, hoursLeft } = checkCanRepost(lastNotificationSentAt);
  const isLoading = isReposting[productId] || false;

  const handleRepost = async () => {
    if (!canRepost || isLoading) return;
    
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRepost}
      disabled={isLoading}
      className="w-full mt-2 text-xs hover:bg-blue-50 hover:border-blue-300"
    >
      {isLoading ? (
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <>📢</>
      )}
      {isLoading ? 'Отправка...' : 'Репост'}
    </Button>
  );
};