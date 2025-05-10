
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import OrderConfirmationDialog from "./OrderConfirmationDialog";
import ProfileWarningDialog from "./ProfileWarningDialog";
import SuccessOrderDialog from "./SuccessOrderDialog";
import { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

interface ContactButtonsProps {
  onContactTelegram: () => void;
  onContactWhatsApp: () => void;
  telegramUrl?: string;
  product: {
    id?: string; 
    title: string;
    price: number;
    brand: string;
    model: string;
    description?: string;
    optid_created?: string | null;
    seller_id?: string;
    seller_name?: string;
    lot_number?: string | number | null;
    status?: string;
    delivery_price?: number;
  };
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  onContactTelegram,
  onContactWhatsApp,
  telegramUrl,
  product,
  deliveryMethod,
  onDeliveryMethodChange,
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const isSeller = profile?.user_type === 'seller';
  const isProductSold = product.status === 'sold';

  const handleBuyNow = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    if (isSeller) {
      toast({
        title: "Ограничение доступа",
        description: "Продавцы не могут оформлять заказы",
        variant: "destructive",
      });
      return;
    }

    // Updated profile check to allow orders if at least Telegram is provided
    if (!profile?.telegram) {
      setShowProfileWarning(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleContactAction = (action: () => void) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    action();
  };

  const handleGoToProfile = () => {
    setShowProfileWarning(false);
    navigate('/profile');
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/login');
  };

  const handleConfirmOrder = async (orderData: { text_order?: string }) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (!product.seller_id || !product.id) {
        throw new Error('Missing required product information');
      }

      const { data: currentProduct, error: productCheckError } = await supabase
        .from('products')
        .select('status, delivery_price')
        .eq('id', product.id)
        .single();
        
      if (productCheckError) {
        console.error('Error checking product status:', productCheckError);
        throw new Error('Failed to verify product availability');
      }
      
      if (currentProduct.status !== 'active') {
        toast({
          title: "Товар недоступен",
          description: "Этот товар уже продан или недоступен для заказа",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let lotNumberOrder: number | null = null;
      
      if (product.lot_number !== undefined && product.lot_number !== null) {
        if (typeof product.lot_number === 'string') {
          lotNumberOrder = parseFloat(product.lot_number);
          if (isNaN(lotNumberOrder)) {
            lotNumberOrder = null;
          }
        } else {
          lotNumberOrder = product.lot_number as number;
        }
      }
      
      let productImages: string[] = [];
      if (product.id) {
        const { data: productImagesData, error: productImagesError } = await supabase
          .from('product_images')
          .select('url')
          .eq('product_id', product.id);
          
        if (productImagesError) {
          console.error('Error fetching product images:', productImagesError);
        } else if (productImagesData && productImagesData.length > 0) {
          productImages = productImagesData.map(img => img.url);
          console.log('Found product images:', productImages);
        }
      }

      console.log('Product delivery price:', currentProduct.delivery_price);

      const orderPayload = {
        title: product.title,
        quantity: 1,
        brand: product.brand,
        model: product.model,
        price: product.price,
        description: product.description || null,
        buyer_id: user?.id,
        seller_id: product.seller_id,
        seller_opt_id: product.optid_created,
        buyer_opt_id: profile?.opt_id || null,
        status: 'created' as OrderStatus,
        order_seller_name: product.seller_name || "Unknown Seller",
        order_created_type: 'ads_order' as OrderCreatedType,
        telegram_url_order: profile?.telegram || null,
        product_id: product.id,
        lot_number_order: lotNumberOrder,
        images: productImages,
        delivery_method: deliveryMethod,
        text_order: orderData.text_order || null,
        delivery_price_confirm: currentProduct.delivery_price,
      };

      console.log('Order payload with delivery price:', orderPayload);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', order);
      console.log('Saved delivery price:', order.delivery_price_confirm);

      const { error: updateError } = await supabase
        .from('products')
        .update({ status: 'sold' })
        .eq('id', product.id);

      if (updateError) {
        console.error('Error updating product status:', updateError);
        toast({
          title: "Внимание",
          description: "Заказ создан, но статус товара не обновился. Пожалуйста, сообщите администратору.",
          variant: "destructive",
        });
      } else {
        console.log('Product status updated to sold successfully');
      }

      if (deliveryMethod === 'self_pickup') {
        setOrderNumber(order.order_number);
        setShowSuccessDialog(true);
        setShowConfirmDialog(false);
      } else {
        toast({
          title: "Заказ успешно создан",
          description: "Вы будете перенаправлены на страницу заказов",
          duration: 3000,
        });
        setShowConfirmDialog(false);
        
        setTimeout(() => {
          window.location.href = '/orders';
        }, 1500);
      }
    } catch (error) {
      console.error('Error handling order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ. Попробуйте ��озже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    window.location.href = '/orders';
  };

  return (
    <>
      {!isSeller && !isProductSold && (
        <Button 
          className="w-full bg-secondary text-white hover:bg-secondary-hover hover:-translate-y-0.5 mb-3 shadow-xl transition-all"
          size="lg"
          onClick={handleBuyNow}
        >
          <ShoppingCart className="mr-2 h-5 w-5" /> Купить сейчас
        </Button>
      )}

      {isProductSold && (
        <div className="w-full p-4 mb-3 bg-gray-50 text-center text-gray-600 font-medium rounded-lg border border-gray-200 animate-pulse-soft">
          Товар продан
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-1">
        <Button 
          variant="outline"
          className="border-primary border-2"
          size="lg"
          onClick={() => handleContactAction(onContactTelegram)}
        >
          <MessageSquare className="mr-2 h-5 w-5" /> Telegram
        </Button>

        <Button 
          className="bg-[#25d366] hover:bg-[#20bd5c] text-white shadow-lg"
          size="lg"
          onClick={() => handleContactAction(onContactWhatsApp)}
        >
          <MessageSquare className="mr-2 h-5 w-5" /> WhatsApp
        </Button>
      </div>

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
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={onDeliveryMethodChange}
      />

      <SuccessOrderDialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        orderNumber={orderNumber || 0}
      />

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Требуется авторизация</DialogTitle>
            <DialogDescription>
              Для использования этой функции необходимо войти в аккаунт или зарегистрироваться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
              Войти / Зарегистрироваться
            </Button>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} className="w-full sm:w-auto">
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactButtons;
