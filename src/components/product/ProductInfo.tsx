import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share2, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import OrderConfirmationDialog from "@/components/product/OrderConfirmationDialog";
import { CommunicationWarningDialog } from "@/components/product/seller/CommunicationWarningDialog";
import { SimpleMakeOfferButton } from "@/components/price-offer/SimpleMakeOfferButton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useImageCacheManager } from "./images/ImageCacheManager";

interface ProductInfoProps {
  product: Product;
  sellerProfile: any;
  deliveryMethod: any;
  onDeliveryMethodChange: (method: any) => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
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

  // Function to get product videos with enhanced logging
  const getProductVideos = () => {
    const videos = product.product_videos?.map(video => video.url) || [];
    console.log('🎬 Desktop - Getting product videos:', {
      product_id: product.id,
      product_videos_raw: product.product_videos,
      videos_count: videos.length,
      videos: videos
    });
    return videos;
  };

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    setIsSubmittingOrder(true);
    try {
      // Prepare product images - get URLs from product_images
      const productImages = product.product_images?.map(img => img.url) || [];
      console.log('📸 Desktop - Product images for order:', productImages);
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Получаем видео из товара с улучшенным логированием
      const productVideos = getProductVideos();
      console.log('🎬 Desktop - Product videos for order:', {
        product_id: product.id,
        videos_count: productVideos.length,
        videos: productVideos,
        product_videos_exist: !!product.product_videos,
        product_videos_length: product.product_videos?.length || 0
      });
      
      // Prepare delivery price - only for cargo methods and if delivery price exists
      const shouldIncludeDeliveryPrice = 
        (deliveryMethod === 'cargo_rf' || deliveryMethod === 'cargo_kz') && 
        product.delivery_price && 
        product.delivery_price > 0;
      
      const deliveryPriceConfirm = shouldIncludeDeliveryPrice ? product.delivery_price : null;
      console.log('💰 Desktop - Delivery method:', deliveryMethod);
      console.log('💰 Desktop - Product delivery price:', product.delivery_price);
      console.log('💰 Desktop - Should include delivery price:', shouldIncludeDeliveryPrice);
      console.log('💰 Desktop - Final delivery price for order:', deliveryPriceConfirm);

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
        p_images: productImages,
        p_product_id: product.id,
        p_delivery_method: deliveryMethod,
        p_text_order: orderData.text_order,
        p_delivery_price_confirm: deliveryPriceConfirm,
        p_quantity: 1,
        p_description: product.description,
        p_buyer_opt_id: profile?.opt_id,
        p_lot_number_order: product.lot_number,
        p_telegram_url_buyer: profile?.telegram,
        p_video_url: productVideos // ИСПРАВЛЕНО: передаем видео из товара
      };

      console.log('🚀 Desktop - Creating order with RPC function:', {
        ...orderParams,
        p_video_url_count: orderParams.p_video_url.length,
        p_video_url_details: orderParams.p_video_url
      });

      const { data: orderId, error } = await supabase
        .rpc('create_user_order', orderParams);

      if (error) throw error;

      console.log('✅ Desktop - Order created successfully with ID:', orderId);

      // Инвалидируем кэш товара после создания заказа
      invalidateAllCaches(product.id);

      toast({
        title: "Заказ создан!",
        description: "Ваш заказ успешно создан и отправлен продавцу.",
      });

      setShowOrderDialog(false);
      navigate('/buyer-orders');
    } catch (error) {
      console.error('❌ Desktop - Error creating order:', error);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Действия с товаром</h2>
        <div className="flex gap-2">
          {/* Favorite Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite(product.id)}
            disabled={isUpdating}
            className={`${
              isFavorite(product.id) 
                ? 'text-red-600 border-red-200 bg-red-50' 
                : ''
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
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {product.status === 'active' && user && (
        <div className="flex gap-2 mb-4">
          {/* Contact Button */}
          <Button
            onClick={handleContactClick}
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Связаться
          </Button>
          
          {/* Make Offer Button */}
          <div className="flex-1">
            <SimpleMakeOfferButton
              product={product}
            />
          </div>
          
          {/* Buy Button */}
          <Button
            onClick={() => setShowOrderDialog(true)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Купить за ${product.price}
          </Button>
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
    </div>
  );
};

export default ProductInfo;
