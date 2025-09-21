import React from 'react';
import { MessageCircle, Send } from 'lucide-react';

interface ContactButtonsProps {
  phone?: string;
  telegram?: string;
  className?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  phone,
  telegram,
  className = ""
}) => {
  const handleWhatsAppClick = () => {
    const whatsappPhone = phone || '+971501234567'; // fallback number
    const url = `https://wa.me/${whatsappPhone.replace(/[^0-9+]/g, '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramClick = () => {
    const telegramUsername = telegram || 'example_user'; // fallback username
    const cleanUsername = telegramUsername.replace('@', '').replace('https://t.me/', '');
    const url = `https://t.me/${cleanUsername}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors duration-200 flex items-center justify-center gap-2"
        title="Связаться через WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {/* Telegram Button */}
      <button
        onClick={handleTelegramClick}
        className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 transition-colors duration-200 flex items-center justify-center gap-2"
        title="Связаться через Telegram"
      >
        <Send className="h-6 w-6" />
        <span className="hidden sm:inline">Telegram</span>
      </button>
    </div>
  );
};

export default ContactButtons;