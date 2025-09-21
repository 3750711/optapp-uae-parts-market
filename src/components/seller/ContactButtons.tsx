import React from 'react';
import { Share, Send } from 'lucide-react';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';

interface ContactButtonsProps {
  sellerId?: string;
  sellerName?: string;
  className?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  sellerId,
  sellerName,
  className = ""
}) => {
  const handleWhatsAppShare = () => {
    if (!sellerId) return;
    
    const publicUrl = `${PRODUCTION_DOMAIN}/public-seller-profile/${sellerId}`;
    const message = `Посмотрите мой каталог автозапчастей${sellerName ? ` (${sellerName})` : ''}: ${publicUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    if (!sellerId) return;
    
    const publicUrl = `${PRODUCTION_DOMAIN}/public-seller-profile/${sellerId}`;
    const message = `Посмотрите мой каталог автозапчастей${sellerName ? ` (${sellerName})` : ''}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(message)}`;
    
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  if (!sellerId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WhatsApp Share Button */}
      <button
        onClick={handleWhatsAppShare}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 flex items-center justify-center gap-2"
        title="Поделиться каталогом в WhatsApp"
      >
        <Share className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {/* Telegram Share Button */}
      <button
        onClick={handleTelegramShare}
        className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 transition-colors duration-200 flex items-center justify-center gap-2"
        title="Поделиться каталогом в Telegram"
      >
        <Send className="h-5 w-5" />
        <span className="hidden sm:inline">Telegram</span>
      </button>
    </div>
  );
};

export default ContactButtons;