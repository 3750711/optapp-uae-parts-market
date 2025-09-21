import React from 'react';
import { Share, Send } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';

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

  const getWhatsAppUrl = () => {
    const publicUrl = getShareUrl();
    if (!publicUrl) return null;
    
    const sanitizedName = sellerName?.replace(/[^\w\s]/g, '').trim();
    const text = encodeURIComponent(`Good afternoon, you can view my full catalog here${sanitizedName ? ` - ${sanitizedName}` : ''}`);
    const url = encodeURIComponent(publicUrl);
    
    return `https://wa.me/?text=${text}%20${url}`;
  };

  const getTelegramUrl = () => {
    const publicUrl = getShareUrl();
    if (!publicUrl) return null;
    
    const sanitizedName = sellerName?.replace(/[^\w\s]/g, '').trim();
    const text = encodeURIComponent(`Good afternoon, you can view my full catalog here, I will be glad to cooperate${sanitizedName ? ` (${sanitizedName})` : ''}`);
    const url = encodeURIComponent(publicUrl);
    
    return `https://t.me/share/url?url=${url}&text=${text}`;
  };

  if (!sellerId) {
    return null;
  }

  const whatsappUrl = getWhatsAppUrl();
  const telegramUrl = getTelegramUrl();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WhatsApp Share Link */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 inline-flex items-center justify-center gap-2"
          title="Поделиться каталогом в WhatsApp"
        >
          <Share className="h-5 w-5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      )}

      {/* Telegram Share Link */}
      {telegramUrl && (
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 transition-colors duration-200 inline-flex items-center justify-center gap-2"
          title="Поделиться каталогом в Telegram"
        >
          <Send className="h-5 w-5" />
          <span className="hidden sm:inline">Telegram</span>
        </a>
      )}
    </div>
  );
};

export default ContactButtons;