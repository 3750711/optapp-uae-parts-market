import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, AlertCircle, Package2, Truck, ShoppingCart, Info } from "lucide-react";
import ProductActions from "./ProductActions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProductEditForm from "./ProductEditForm";
import OrderConfirmationDialog from "./OrderConfirmationDialog";
import { Product } from "@/types/product";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { SimpleMakeOfferButton } from "@/components/price-offer/SimpleMakeOfferButton";
import { useImageCacheManager } from "./images/ImageCacheManager";

interface ProductInfoProps {
  product: Product;
  onProductUpdate: () => void;
  deliveryMethod: Database["public"]["Enums"]["delivery_method"];
  onDeliveryMethodChange: (method: Database["public"]["Enums"]["delivery_method"]) => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ 
  product, 
  onProductUpdate, 
  deliveryMethod, 
  onDeliveryMethodChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { user, profile } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invalidateAllCaches } = useImageCacheManager();
  const isOwner = user?.id === product.seller_id;

  const canViewDeliveryPrice = user && profile?.opt_status === 'opt_user';

  // Function to get product images
  const getProductImages = async (): Promise<string[]> => {
    try {
      const { data: images, error } = await supabase
        .from('product_images')
        .select('url, is_primary')
        .eq('product_id', product.id)
        .order('is_primary', { ascending: false }); // Primary images first

      if (error) {
        console.error('Error fetching product images:', error);
        return [];
      }

      return images?.map(img => img.url) || [];
    } catch (error) {
      console.error('Error getting product images:', error);
      return [];
    }
  };

  // Function to get product videos
  const getProductVideos = async (): Promise<string[]> => {
    try {
      const { data: videos, error } = await supabase
        .from('product_videos')
        .select('url')
        .eq('product_id', product.id);

      if (error) {
        console.error('Error fetching product videos:', error);
        return [];
      }

      return videos?.map(video => video.url) || [];
    } catch (error) {
      console.error('Error getting product videos:', error);
      return [];
    }
  };

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    setIsSubmittingOrder(true);
    try {
      console.log('Starting order creation process for product:', product.id);
      
      // Get product images and videos
      const [productImages, productVideos] = await Promise.all([
        getProductImages(),
        getProductVideos()
      ]);

      console.log('Retrieved product media:', {
        images: productImages.length,
        videos: productVideos.length
      });

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
        p_status: 'created' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: null,
        p_images: productImages, // Pass actual product images
        p_product_id: product.id,
        p_delivery_method: deliveryMethod,
        p_text_order: orderData.text_order || null,
        p_delivery_price_confirm: product.delivery_price || null, // Pass actual delivery price
        p_quantity: 1,
        p_description: product.description || null,
        p_buyer_opt_id: profile?.opt_id || null,
        p_lot_number_order: product.lot_number || null,
        p_telegram_url_buyer: profile?.telegram || null,
        p_video_url: productVideos // Pass actual product videos
      };

      console.log('Creating order with parameters:', orderParams);

      const { data: orderId, error } = await supabase
        .rpc('create_user_order', orderParams);

      if (error) throw error;

      console.log('Order created successfully with ID:', orderId);

      // Invalidate caches after successful order creation
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

  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="animate-pulse-soft">Ожидает проверки</Badge>;
      case 'active':
        return <Badge variant="success">Опубликован</Badge>;
      case 'sold':
        return <Badge variant="info">Продан</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100">Архив</Badge>;
      default:
        return null;
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    onProductUpdate();
  };

  if (isEditing && isOwner && product.status !== 'sold') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-card animate-fade-in">
        <ProductEditForm
          product={product}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
          isCreator={true}
        />
      </div>
    );
  }

  const location = product.product_location || "Dubai";

  return (
    <div className="animate-fade-in">
      {/* Product Actions */}
      <ProductActions 
        productId={product.id} 
        productTitle={product.title}
        viewCount={product.view_count || 0}
      />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-muted-foreground flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1" /> {location}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && product.status !== 'sold' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
              Редактировать
            </Button>
          )}
        </div>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{product.title}</h1>
      <div className="mb-4 flex items-center gap-2">
        <span className="font-bold text-2xl text-primary">
          {product.price} $
        </span>
        {canViewDeliveryPrice ? (
          product.delivery_price !== null && product.delivery_price !== undefined && product.delivery_price > 0 ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Truck className="w-4 h-4 text-gray-500" />
              <span>Доставка: {product.delivery_price} $</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>Стоимость доставки уточняется при заказе</span>
            </div>
          )
        ) : (
          user ? (
            <div className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
              <Info className="w-4 h-4" />
              <span>Стоимость доставки доступна для OPT пользователей</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg border border-yellow-200">
              <Info className="w-4 h-4" />
              <span>
                <a href="/login" className="text-blue-600 hover:underline font-medium">Авторизуйтесь</a> для просмотра стоимости доставки
              </span>
            </div>
          )
        )}
      </div>
      
      {/* Кнопки "Купить" и "Предложить цену" */}
      {!isOwner && product.status === 'active' && user && (
        <div className="mb-6 flex gap-4 items-center">
          <Button
            onClick={() => setShowOrderDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 text-lg"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Купить товар
          </Button>
          
          <SimpleMakeOfferButton
            product={product}
          />
        </div>
      )}
      
      <div className="mb-6 space-y-4">
        <h3 className="font-medium mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1.5 text-muted-foreground" />
          Описание:
        </h3>
        <p className="text-foreground/80 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
          {product.description || "Описание отсутствует"}
        </p>
        <div className="flex items-center text-muted-foreground mt-2">
          <Package2 className="h-4 w-4 mr-1.5" />
          <span>Количество мест для отправки: {product.place_number || 1}</span>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
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
    </div>
  );
};

export default ProductInfo;
