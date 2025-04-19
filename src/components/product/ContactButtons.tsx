
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContactButtonsProps {
  onBuyNow: () => void;
  onContactTelegram: () => void;
  onContactWhatsApp: () => void;
  telegramUrl?: string;
  phoneUrl?: string;
  productId?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ 
  onContactTelegram, 
  onContactWhatsApp,
  telegramUrl,
  phoneUrl,
  productId
}) => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    if (productId) {
      navigate(`/seller/create-order?productId=${productId}`);
    }
  };

  return (
    <>
      <Button 
        className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 mb-2"
        onClick={handleBuyNow}
      >
        <ShoppingCart className="mr-2 h-4 w-4" /> Купить
      </Button>
      
      <Button 
        variant="outline"
        className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white mb-2"
        onClick={onContactTelegram}
      >
        <MessageSquare className="mr-2 h-4 w-4" /> Написать сообщение
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
