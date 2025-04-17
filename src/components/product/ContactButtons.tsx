
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare } from "lucide-react";

interface ContactButtonsProps {
  onBuyNow: () => void;
  onContactTelegram: () => void;
  onContactWhatsApp: () => void;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ 
  onBuyNow, 
  onContactTelegram, 
  onContactWhatsApp 
}) => {
  return (
    <>
      <Button 
        className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
        onClick={onBuyNow}
      >
        <ShoppingCart className="mr-2 h-4 w-4" /> Купить
      </Button>
      
      <Button 
        variant="outline"
        className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
        onClick={onContactTelegram}
      >
        <MessageSquare className="mr-2 h-4 w-4" /> Связаться в Telegram
      </Button>
      
      <Button 
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        onClick={onContactWhatsApp}
      >
        <MessageSquare className="mr-2 h-4 w-4" /> Связаться в WhatsApp
      </Button>
    </>
  );
};

export default ContactButtons;
