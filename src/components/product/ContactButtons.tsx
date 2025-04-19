
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import OrderConfirmationDialog from "./OrderConfirmationDialog";
import ProfileWarningDialog from "./ProfileWarningDialog";

interface ContactButtonsProps {
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
    description?: string;
    optid_created?: string | null;
    seller_id?: string;
    seller_name?: string;
  };
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  onContactTelegram,
  onContactWhatsApp,
  product
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему для совершения покупки",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!profile?.opt_id || !profile?.telegram) {
      setShowProfileWarning(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleGoToProfile = () => {
    setShowProfileWarning(false);
    navigate('/profile');
  };

  const handleConfirmOrder = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (!product.seller_id) {
        throw new Error('Missing seller information');
      }
      
      console.log('Creating order with seller name:', product.seller_name);
      console.log('Product data:', product);
      
      // Define the order object including order_seller_name
      const orderData = {
        title: product.title,
        quantity: 1,
        brand: product.brand,
        model: product.model,
        price: product.price,
        description: product.description || null,
        buyer_id: user?.id,
        seller_id: product.seller_id,
        seller_opt_id: product.optid_created,
        buyer_opt_id: profile?.opt_id,
        status: 'pending' as 'pending' | 'verified',
        order_seller_name: product.seller_name
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      toast({
        title: "Заказ успешно создан",
        description: "Вы будете перенаправлены на страницу заказов",
      });
      
      setShowConfirmDialog(false);
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

      <ProfileWarningDialog
        open={showProfileWarning}
        onOpenChange={setShowProfileWarning}
        onGoToProfile={handleGoToProfile}
      />

      <OrderConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmOrder}
        isSubmitting={isSubmitting}
        product={product}
        profile={profile}
      />
    </>
  );
};

export default ContactButtons;
