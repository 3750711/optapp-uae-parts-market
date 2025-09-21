import React from 'react';
import { Share, Send } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';
import { useToast } from '@/hooks/use-toast';

interface ContactButtonsProps {
  sellerId?: string;
  sellerName?: string;
  className?: string;
  storeInfo?: {
    id?: string;
    public_share_token?: string;
    public_share_enabled?: boolean;
  } | null;
  profileInfo?: {
    public_share_token?: string;
    public_share_enabled?: boolean;
  } | null;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  sellerId,
  sellerName,
  className = "",
  storeInfo,
  profileInfo
}) => {
  const { toast } = useToast();

  const getShareUrl = () => {
    if (!sellerId) return null;
    
    console.log('ContactButtons data:', { 
      sellerId, 
      storeInfo, 
      profileInfo,
      PRODUCTION_DOMAIN 
    });
    
    // Priority 1: Store with public token
    if (storeInfo?.public_share_token && storeInfo?.public_share_enabled) {
      const storeUrl = `${PRODUCTION_DOMAIN}/public-store/${storeInfo.public_share_token}`;
      console.log('Using store URL:', storeUrl);
      return storeUrl;
    }
    
    // Priority 2: Profile with public token  
    if (profileInfo?.public_share_token && profileInfo?.public_share_enabled) {
      const profileUrl = `${PRODUCTION_DOMAIN}/public-profile/${profileInfo.public_share_token}`;
      console.log('Using profile URL:', profileUrl);
      return profileUrl;
    }
    
    console.log('No public sharing URL available');
    return null;
  };

  const copyWhatsAppMessage = async () => {
    const publicUrl = getShareUrl();
    if (!publicUrl) return;
    
    const sanitizedName = sellerName?.replace(/[^\w\s]/g, '').trim();
    const message = `Good afternoon, you can view my full catalog here${sanitizedName ? ` - ${sanitizedName}` : ''} ${publicUrl}`;
    
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Сообщение скопировано! Вставьте его в WhatsApp');
      // Открываем WhatsApp без предзаполненного текста
      window.open('https://wa.me/', '_blank');
    } catch (err) {
      console.error('Failed to copy message:', err);
      toast.error('Не удалось скопировать сообщение');
    }
  };

  const copyTelegramMessage = async () => {
    const publicUrl = getShareUrl();
    if (!publicUrl) return;
    
    const sanitizedName = sellerName?.replace(/[^\w\s]/g, '').trim();
    const message = `Good afternoon, you can view my full catalog here, I will be glad to cooperate${sanitizedName ? ` (${sanitizedName})` : ''} ${publicUrl}`;
    
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Сообщение скопировано! Вставьте его в Telegram');
      // Открываем Telegram без предзаполненного текста
      window.open('https://t.me/', '_blank');
    } catch (err) {
      console.error('Failed to copy message:', err);
      toast.error('Не удалось скопировать сообщение');
    }
  };

  if (!sellerId) {
    return null;
  }

  const hasShareUrl = getShareUrl() !== null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WhatsApp Share Button */}
      {hasShareUrl && (
        <button
          onClick={copyWhatsAppMessage}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 inline-flex items-center justify-center gap-2"
          title="Скопировать сообщение для WhatsApp"
        >
          <Share className="h-5 w-5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      )}

      {/* Telegram Share Button */}
      {hasShareUrl && (
        <button
          onClick={copyTelegramMessage}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 transition-colors duration-200 inline-flex items-center justify-center gap-2"
          title="Скопировать сообщение для Telegram"
        >
          <Send className="h-5 w-5" />
          <span className="hidden sm:inline">Telegram</span>
        </button>
      )}
    </div>
  );
};

export default ContactButtons;