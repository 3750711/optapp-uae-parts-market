import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share2, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import OrderConfirmationDialog from "@/components/product/OrderConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MobileStickyActionsProps {
  product: Product;
  sellerProfile: any;
  deliveryMethod: any;
  onDeliveryMethodChange: (method: any) => void;
}

const MobileStickyActions: React.FC<MobileStickyActionsProps> = ({
  product,
  sellerProfile,
  deliveryMethod,
  onDeliveryMethodChange,
}) => {
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user, profile } = useAuth();
  const { isFavorite, toggleFavorite, isUpdating } = useFavorites();
  const navigate = useNavigate();
  const isOwner = user?.id === product.seller_id;

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    setIsSubmittingOrder(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          buyer_id: user?.id,
          seller_id: product.seller_id,
          delivery_method: deliveryMethod,
          text_order: orderData.text_order,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Заказ создан!",
        description: "Ваш заказ успешно создан и отправлен продавцу.",
      });

      setShowOrderDialog(false);
      navigate('/buyer-orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          url: url,
        });
      } catch (error) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на товар скопирована в буфер обмена",
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на товар скопирована в буфер обмена",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
          variant: "destructive",
        });
      }
    }
  };

  if (isOwner) return null;

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed right-4 bottom-24 z-30 flex flex-col gap-2">
        {/* Favorite Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleFavorite(product.id)}
          disabled={isUpdating}
          className={`shadow-lg rounded-full w-12 h-12 ${
            isFavorite(product.id) 
              ? 'text-red-600 border-red-200 bg-red-50' 
              : 'bg-white'
          }`}
        >
          <Heart 
            className={`h-5 w-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} 
          />
        </Button>

        {/* Share Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleShare}
          className="shadow-lg rounded-full w-12 h-12 bg-white"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Sticky Bar */}
      {product.status === 'active' && user && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg p-3">
          <div className="flex gap-2">
            {/* Buy Button */}
            <Button
              onClick={() => setShowOrderDialog(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-sm"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Купить за {product.price} $
            </Button>
          </div>
        </div>
      )}

      {/* Order Dialog */}
      <OrderConfirmationDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        onConfirm={handleOrderConfirm}
        isSubmitting={isSubmittingOrder}
        product={{
          id: product.id,
          title: product.title,
          brand: product.brand || "",
          model: product.model || "",
          price: product.price,
          description: product.description,
          optid_created: product.optid_created,
          seller_id: product.seller_id,
          seller_name: product.seller_name,
          lot_number: product.lot_number,
          delivery_price: product.delivery_price,
        }}
        profile={profile}
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={onDeliveryMethodChange}
      />
    </>
  );
};

export default MobileStickyActions;