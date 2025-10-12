import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobileEnhanced } from '@/hooks/use-mobile-enhanced';
import { useLanguage } from '@/hooks/useLanguage';
import { getCommonTranslations } from '@/utils/translations/common';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';
import { logger } from '@/utils/logger';

interface ShareProfileDialogProps {
  sellerId: string;
  sellerName: string;
  className?: string;
  storeInfo?: {
    id?: string;
  } | null;
}

const ShareProfileDialog: React.FC<ShareProfileDialogProps> = ({
  sellerId,
  sellerName,
  className = "",
  storeInfo,
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobileEnhanced();
  const { language } = useLanguage();
  const t = getCommonTranslations(language);

  const profileUrl = sellerId ? `${PRODUCTION_DOMAIN}/public-profile/${sellerId}` : null;

  if (!profileUrl) {
    return null;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: t.share.linkCopied,
      });
    } catch (err) {
      logger.error('Failed to copy link:', err);
      toast({
        variant: "destructive",
        title: t.share.failedToCopy,
      });
    }
  };

  return (
    <Button
      onClick={handleCopyLink}
      variant="outline"
      size={isMobile ? "icon" : "default"}
      className={`bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 ${className}`}
      title={t.buttons.share}
      aria-label={t.buttons.share}
    >
      <Share2 className="h-5 w-5" />
      {!isMobile && <span className="ml-2">{t.buttons.share}</span>}
    </Button>
  );
};

export default ShareProfileDialog;