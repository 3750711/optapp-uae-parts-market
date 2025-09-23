import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { usePublicStoreShare } from '@/hooks/usePublicStoreShare';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface ShareStoreButtonsProps {
  storeId: string;
  storeName: string;
  className?: string;
}

const ShareStoreButtons: React.FC<ShareStoreButtonsProps> = ({
  storeId,
  storeName,
  className = ""
}) => {
  const { 
    generatePublicLink, 
    getShareUrls, 
    isGenerating 
  } = usePublicStoreShare();

  const shareToApp = async (platform: 'whatsapp' | 'telegram') => {
    try {
      const result = await generatePublicLink(storeId);
      const shareUrls = getShareUrls(result.url);
      
      const url = platform === 'whatsapp' ? shareUrls.whatsapp : shareUrls.telegram;
      window.open(url, '_blank');
      
    } catch (error) {
      logger.error(`Error sharing to ${platform}:`, error);
      toast.error(`Ошибка расшаривания в ${platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}`);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Поделиться магазином:
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareToApp('whatsapp')}
        disabled={isGenerating}
        className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        WhatsApp
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => shareToApp('telegram')}
        disabled={isGenerating}
        className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Telegram
      </Button>
    </div>
  );
};

export default ShareStoreButtons;