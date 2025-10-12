import React, { useState } from 'react';
import { Share2, MessageCircle, Send, Mail, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  profileInfo?: {
    public_share_token?: string;
    public_share_enabled?: boolean;
  } | null;
}

const ShareProfileDialog: React.FC<ShareProfileDialogProps> = ({
  sellerId,
  sellerName,
  className = "",
  storeInfo,
  profileInfo,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobileEnhanced();
  const { language } = useLanguage();
  const t = getCommonTranslations(language);

  // Generate the appropriate URL based on sellerId
  const getShareUrl = () => {
    if (sellerId) {
      return `${PRODUCTION_DOMAIN}/public-profile/${sellerId}`;
    }
    return null;
  };

  const profileUrl = getShareUrl();
  const sanitizedName = sellerName?.replace(/[^\w\s]/g, '').trim();

  if (!profileUrl) {
    return null;
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${sanitizedName || 'Seller'} - PartsBay`,
          text: `Check out ${sanitizedName ? `${sanitizedName}'s` : 'this'} store on PartsBay`,
          url: profileUrl,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          logger.error('Web Share API failed:', error);
        }
        return false;
      }
    }
    return false;
  };

  const handleShare = async () => {
    const shared = await handleNativeShare();
    if (!shared) {
      setIsDialogOpen(true);
    }
  };

  const handleWhatsAppShare = async () => {
    const message = `Good afternoon, you can view my full catalog here${sanitizedName ? ` - ${sanitizedName}` : ''} ${profileUrl}`;
    
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: t.share.messageCopied,
        description: "WhatsApp",
      });
      window.open('https://wa.me/', '_blank');
      setIsDialogOpen(false);
    } catch (err) {
      logger.error('Failed to copy message:', err);
      toast({
        variant: "destructive",
        title: t.share.failedToCopy,
        description: "WhatsApp",
      });
    }
  };

  const handleTelegramShare = async () => {
    const message = `Good afternoon, you can view my full catalog here, I will be glad to cooperate${sanitizedName ? ` (${sanitizedName})` : ''} ${profileUrl}`;
    
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: t.share.messageCopied,
        description: "Telegram",
      });
      window.open('https://t.me/', '_blank');
      setIsDialogOpen(false);
    } catch (err) {
      logger.error('Failed to copy message:', err);
      toast({
        variant: "destructive",
        title: t.share.failedToCopy,
        description: "Telegram",
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out ${sanitizedName || 'this seller'} on PartsBay`);
    const body = encodeURIComponent(`Good afternoon,\n\nYou can view my full catalog here${sanitizedName ? ` - ${sanitizedName}` : ''}:\n\n${profileUrl}\n\nBest regards`);
    
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:?subject=${subject}&body=${body}`;
    emailLink.rel = 'noopener noreferrer';
    emailLink.target = '_blank';
    emailLink.click();
    setIsDialogOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: t.share.linkCopied,
      });
      setIsDialogOpen(false);
    } catch (err) {
      logger.error('Failed to copy link:', err);
      toast({
        variant: "destructive",
        title: t.share.failedToCopy,
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleShare}
          variant="outline"
          size={isMobile ? "icon" : "default"}
          className={`bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 ${className}`}
          title={t.buttons.share}
          aria-label={t.buttons.share}
        >
          <Share2 className="h-5 w-5" />
          {!isMobile && <span className="ml-2">{t.buttons.share}</span>}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.share.shareVia}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            onClick={handleWhatsAppShare}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-sm">{t.share.whatsapp}</span>
          </Button>
          
          <Button
            onClick={handleTelegramShare}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 bg-sky-500 hover:bg-sky-600 text-white border-sky-500 hover:border-sky-600"
          >
            <Send className="h-6 w-6" />
            <span className="text-sm">{t.share.telegram}</span>
          </Button>
          
          <Button
            onClick={handleEmailShare}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20"
          >
            <Mail className="h-6 w-6" />
            <span className="text-sm">{t.share.email}</span>
          </Button>
          
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex flex-col items-center gap-2 h-20"
          >
            <Copy className="h-6 w-6" />
            <span className="text-sm">{t.share.copyLink}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileDialog;