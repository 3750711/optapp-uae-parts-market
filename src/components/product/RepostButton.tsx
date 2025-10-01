import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useProductRepost } from "@/hooks/useProductRepost";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";
import RepostPriceDialog from "./RepostPriceDialog";

interface RepostButtonProps {
  productId: string;
  catalogPosition: string;
  status: string;
  sellerId: string;
  currentPrice: number;
  productTitle: string;
  onRepostSuccess?: () => void;
}

export const RepostButton: React.FC<RepostButtonProps> = ({
  productId,
  catalogPosition,
  status,
  sellerId,
  currentPrice,
  productTitle,
  onRepostSuccess
}) => {
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const { checkCanRepost, sendRepost, isReposting, queuedReposts } = useProductRepost();
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  // Only show for active products
  if (status !== 'active') {
    return null;
  }

  const { canRepost, hoursLeft } = checkCanRepost(catalogPosition);
  const isLoading = isReposting[productId] || false;
  const isQueued = !!queuedReposts[productId];

  const handleRepost = () => {
    if (!canRepost || isLoading || isQueued) return;
    // Open price dialog instead of direct confirmation
    setShowPriceDialog(true);
  };

  const handleRepostConfirm = async (newPrice?: number) => {
    setShowPriceDialog(false);
    
    const success = await sendRepost(productId, newPrice);
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
        className="inline-flex h-8 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-sm font-medium"
        title={t.repostMessages.cooldownTitle.replace('{hours}', hoursLeft.toString())}
      >
        {hoursLeft}H
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
        className="inline-flex h-8 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-sm font-medium bg-blue-50 border-blue-200 text-blue-600"
        title={t.actions.queued}
      >
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        {t.actions.queued}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRepost}
        disabled={isLoading || isQueued}
        className="inline-flex h-8 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-sm font-medium hover:bg-blue-50 hover:border-blue-300"
        title={isLoading ? t.actions.sending : t.actions.repost}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            {t.actions.sending}
          </>
        ) : (
          t.actions.repost
        )}
      </Button>

      <RepostPriceDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        currentPrice={currentPrice}
        productTitle={productTitle}
        onConfirm={handleRepostConfirm}
        isSubmitting={isLoading}
      />
    </>
  );
};