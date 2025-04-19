
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ContactButtonsProps {
  onBuyNow: () => void;
  onContactTelegram: () => void;
  onContactWhatsApp: () => void;
  telegramUrl?: string;
  phoneUrl?: string;
  productId?: string;
  product: {
    title: string;
    price: number;
    brand: string;
    model: string;
    optid_created?: string | null;
  };
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  onContactTelegram,
  onContactWhatsApp,
  telegramUrl,
  phoneUrl,
  productId,
  product
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему для совершения покупки",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('intermediate_orders')
        .insert({
          title: product.title,
          quantity: 1,
          brand: product.brand,
          model: product.model,
          price: product.price,
          seller_opt_id: product.optid_created,
          buyer_opt_id: profile?.opt_id,
          buyer_telegram: profile?.telegram,
          buyer_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Заказ создан",
        description: "Ваш заказ успешно создан",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      });
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
