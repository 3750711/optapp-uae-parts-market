import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, MapPin, MessageCircle } from "lucide-react";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

import CompactSellerInfo from "./CompactSellerInfo";
import MobileActionButtons from "./MobileActionButtons";
import MobileCharacteristicsTable from "./MobileCharacteristicsTable";
import MobileStickyBuyButton from "./MobileStickyBuyButton";
import SellerProducts from "@/components/product/SimilarProducts";
import { Badge } from "@/components/ui/badge";
import OrderConfirmationDialog from "@/components/product/OrderConfirmationDialog";
import { CommunicationWarningDialog } from "@/components/product/seller/CommunicationWarningDialog";
import { SimpleMakeOfferButton } from "@/components/price-offer/SimpleMakeOfferButton";

interface MobileProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  sellerProfile: any;
  sellerName: string;
  deliveryMethod: any;
  onDeliveryMethodChange: (method: any) => void;
  onProductUpdate: () => void;
}

const MobileProductLayout: React.FC<MobileProductLayoutProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  sellerProfile,
  sellerName,
  deliveryMethod,
  onDeliveryMethodChange,
  onProductUpdate,
}) => {
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactType, setContactType] = useState<'telegram' | 'whatsapp'>('telegram');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">На модерации</Badge>;
      case 'active':
        return <Badge variant="success" className="text-xs">В наличии</Badge>;
      case 'sold':
        return <Badge variant="info" className="text-xs">Продано</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-xs bg-gray-100">Архив</Badge>;
      default:
        return null;
    }
  };

  const handleContactSeller = () => {
    setContactType('telegram');
    setShowContactDialog(true);
  };

  const handleMakeOffer = () => {
    // This is now handled by SimpleMakeOfferButton
    console.log('Make offer');
  };

  const handleBuyNow = () => {
    setShowOrderDialog(true);
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

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    setIsSubmittingOrder(true);
    try {
      const productImages = product.product_images?.map(img => img.url) || [];
      const productVideos = product.product_videos?.map(video => video.url) || [];
      
      const shouldIncludeDeliveryPrice = 
        (deliveryMethod === 'cargo_rf' || deliveryMethod === 'cargo_kz') && 
        product.delivery_price && 
        product.delivery_price > 0;
      
      const deliveryPriceConfirm = shouldIncludeDeliveryPrice ? product.delivery_price : null;

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
        p_video_url: productVideos
      };

      const { data: orderId, error } = await supabase
        .rpc('create_user_order', orderParams);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="p-4">
          {/* Full title */}
          <h1 className="text-lg font-bold text-foreground mb-2">
            {[product.brand, product.model, product.title].filter(Boolean).join(' ')}
          </h1>
          
          {/* Price + Status on one line */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-primary">{product.price} $</span>
            {getStatusBadge()}
          </div>
          
          {/* Location in small font */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {product.product_location || "Dubai"}
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white mb-2">
        <ProductGallery 
          images={imageUrls}
          videos={videoUrls}
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={handleContactSeller}
            className="flex items-center gap-1 text-xs px-3 py-2 border border-border rounded-md hover:bg-accent"
          >
            <MessageCircle className="h-3 w-3" />
            Связь
          </button>
          
          <div className="col-span-2">
            <SimpleMakeOfferButton
              product={product}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Characteristics */}
      {(product.brand || product.model || product.lot_number) && (
        <MobileCharacteristicsTable product={product} />
      )}

      {/* Product Description */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Описание товара
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {product.description || (
              <span className="text-muted-foreground italic">
                Описание не добавлено продавцом
              </span>
            )}
          </p>
        </CardContent>
      </Card>



      {/* Delivery Info - Compact */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Доставка:</span>
          <span>
            {deliveryMethod === 'cargo_rf' ? 'Карго до РФ' : 
             deliveryMethod === 'self_pickup' ? 'Самовывоз' : 'Не указано'}
          </span>
          {product.delivery_price && (
            <span className="text-primary font-medium">
              — ${product.delivery_price}
            </span>
          )}
        </div>
      </div>

      {/* Seller Info */}
      <CompactSellerInfo
        sellerProfile={sellerProfile}
        sellerName={sellerName}
        sellerId={product.seller_id}
        productTitle={product.title}
        productId={product.id}
      />

      {/* Seller Products */}
      <SellerProducts 
        currentProductId={product.id}
        sellerId={product.seller_id}
        sellerName={sellerName}
      />

      {/* Bottom padding for sticky buy button */}
      <div className="h-20"></div>

      {/* Sticky Buy Button */}
      <MobileStickyBuyButton 
        product={product}
        onBuyNow={handleBuyNow}
      />

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
        sellerContact={sellerProfile}
        productId={product.id}
        sellerId={product.seller_id}
      />
    </div>
  );
};

export default MobileProductLayout;