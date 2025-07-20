import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share2, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import OrderConfirmationDialog from "@/components/product/OrderConfirmationDialog";
import { CommunicationWarningDialog } from "@/components/product/seller/CommunicationWarningDialog";
import { MakeOfferButtonOptimized } from "@/components/price-offer/MakeOfferButtonOptimized";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useImageCacheManager } from "../images/ImageCacheManager";

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
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactType, setContactType] = useState<'telegram' | 'whatsapp'>('telegram');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user, profile } = useAuth();
  const { isFavorite, toggleFavorite, isUpdating } = useFavorites();
  const navigate = useNavigate();
  const { invalidateAllCaches } = useImageCacheManager();
  const isOwner = user?.id === product.seller_id;

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    setIsSubmittingOrder(true);
    try {
      // Prepare product images - get URLs from product_images
      const productImages = product.product_images?.map(img => img.url) || [];
      console.log('Product images for order:', productImages);
      
      // Prepare delivery price - only for cargo methods and if delivery price exists
      const shouldIncludeDeliveryPrice = 
        (deliveryMethod === 'cargo_rf' || deliveryMethod === 'cargo_kz') && 
        product.delivery_price && 
        product.delivery_price > 0;
      
      const deliveryPriceConfirm = shouldIncludeDeliveryPrice ? product.delivery_price : null;
      console.log('Delivery method:', deliveryMethod);
      console.log('Product delivery price:', product.delivery_price);
      console.log('Should include delivery price:', shouldIncludeDeliveryPrice);
      console.log('Final delivery price for order:', deliveryPriceConfirm);

      const orderParams = {
        p_title: product.title,
        p_price: product.price,
        p_place_number: product.place_number || 1,
        p_seller_id: product.seller_id,
        p_order_seller_name: product.seller_name,
        p_seller_opt_id: null,
        p_buyer_id: user?.id,
        p_brand: product.brand || '',
        p_model: product.model || '',
        p_status: 'created',
        p_order_created_type: 'product_order',
        p_telegram_url_order: null,
        p_images: productImages, // Now passing actual product images
        p_product_id: product.id,
        p_delivery_method: deliveryMethod,
        p_text_order: orderData.text_order,
        p_delivery_price_confirm: deliveryPriceConfirm, // Now passing actual delivery price
        p_quantity: 1,
        p_description: product.description,
        p_buyer_opt_id: profile?.opt_id,
        p_lot_number_order: product.lot_number,
        p_telegram_url_buyer: profile?.telegram,
        p_video_url: []
      };

      console.log('Creating order with RPC function:', orderParams);

      const { data: orderId, error } = await supabase
        .rpc('create_user_order', orderParams);

      if (error) throw error;

      console.log('Order created successfully with ID:', orderId);

      // Инвалидируем кэш товара после создания заказа
      invalidateAllCaches(product.id);

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

  const handleContactClick = () => {
    setContactType('telegram');
    setShowContactDialog(true);
  };

  const handleContactProceed = () => {
    const phoneNumber = sellerProfile?.phone;
    const telegramUsername = sellerProfile?.telegram;
    
    if (contactType === 'telegram' && telegramUsername) {
      const telegramUrl = `https://t.me/${telegramUsername.replace('@', '')}`;
      window.open(telegramUrl, '_blank');
    } else if (contactType === 'whatsapp' && phoneNumber) {
      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;
      window.open(whatsappUrl, '_blank');
    }
    
    setShowContactDialog(false);
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
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg p-2">
          <div className="flex gap-1">
            {/* Contact Button */}
            <Button
              onClick={handleContactClick}
              variant="outline"
              className="flex-1 text-xs px-2 h-9"
              size="sm"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Связь
            </Button>
            
            {/* Make Offer Button - Mobile Version */}
            <div className="flex-1">
              <MakeOfferButtonOptimized
                product={product}
                compact
              />
            </div>
            
            {/* Buy Button */}
            <Button
              onClick={() => setShowOrderDialog(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-xs px-2 h-9"
              size="sm"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              ${product.price}
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

      {/* Contact Dialog */}
      <CommunicationWarningDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        onProceed={handleContactProceed}
        communicationRating={sellerProfile?.communication_ability || 3}
        productTitle={product.title}
        productPrice={product.price}
        lotNumber={product.lot_number}
        contactType={contactType}
      />
    </>
  );
};

export default MobileStickyActions;
