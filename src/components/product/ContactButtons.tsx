
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare } from "lucide-react";

interface ContactButtonsProps {
  onBuyNow: () => void;
  onContactTelegram: () => void;
  onContactWhatsApp: () => void;
  telegramUrl?: string;
  phoneUrl?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ 
  onBuyNow, 
  onContactTelegram, 
  onContactWhatsApp,
  telegramUrl,
  phoneUrl
}) => {
  // Since telegram_url is now stored without https://t.me/ and @, 
  // we just need to construct the full URL
  const fullTelegramUrl = telegramUrl 
    ? `https://t.me/${telegramUrl}` 
    : undefined;

  return (
    <>
      <Button 
        className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 mb-2"
        onClick={onBuyNow}
      >
        <ShoppingCart className="mr-2 h-4 w-4" /> Купить
      </Button>
      
      {fullTelegramUrl ? (
        <a 
          href={fullTelegramUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full"
        >
          <Button 
            variant="outline"
            className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white mb-2"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Связаться с продавцом
          </Button>
        </a>
      ) : (
        <Button 
          variant="outline"
          className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white mb-2"
          onClick={onContactTelegram}
        >
          <MessageSquare className="mr-2 h-4 w-4" /> Написать сообщение
        </Button>
      )}
      
      {phoneUrl ? (
        <a 
          href={`https://wa.me/${phoneUrl}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full"
        >
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Связаться в WhatsApp
          </Button>
        </a>
      ) : (
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={onContactWhatsApp}
        >
          <MessageSquare className="mr-2 h-4 w-4" /> Связаться в WhatsApp
        </Button>
      )}
    </>
  );
};

export default ContactButtons;
