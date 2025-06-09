
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
import { CommunicationWarningDialog } from "./seller/CommunicationWarningDialog";
import { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

interface ContactButtonsProps {
  onContactTelegram: (message?: string) => void;
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
  sellerCommunicationRating?: number | null;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  onContactTelegram,
  onContactWhatsApp,
  telegramUrl,
  product,
  deliveryMethod,
  onDeliveryMethodChange,
  sellerCommunicationRating,
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCommunicationWarning, setShowCommunicationWarning] = useState(false);
  const [pendingContactType, setPendingContactType] = useState<'telegram' | 'whatsapp' | null>(null);

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

    if (!profile?.opt_id || !profile?.telegram) {
      setShowProfileWarning(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleContactAction = (type: 'telegram' | 'whatsapp', action: () => void) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    // Показываем предупреждение о коммуникации
    setPendingContactType(type);
    setShowCommunicationWarning(true);
  };

  const handleCommunicationProceed = () => {
    setShowCommunicationWarning(false);
    
    if (pendingContactType === 'telegram') {
      // Формируем шаблон сообщения для Telegram на английском
      const currentUrl = window.location.href;
      const productUrl = currentUrl.replace(
        /https:\/\/[^\/]+/,
        'https://partsbay.ae'
      );
      const message = `Hello, I saw your advertise on partsbay, can you please send more details about ${productUrl}`;
      onContactTelegram(message);
    } else if (pendingContactType === 'whatsapp') {
      onContactWhatsApp();
    }
    
    setPendingContactType(null);
  };

  const handleGoToProfile = () => {
    setShowProfileWarning(false);
    navigate('/profile');
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/login');
  };

  const getOrdersPageRoute = () => {
    // Определяем правильный маршрут в зависимости от типа пользователя
    if (profile?.user_type === 'seller') {
      return '/seller/orders';
    } else {
      return '/buyer/orders';
    }
  };

  const handleConfirmOrder = async (orderData: { text_order?: string }) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (!product.seller_id || !product.id) {
        throw new Error('Missing required product information');
      }

      console.log('🛒 Starting order creation process...', {
        productId: product.id,
        sellerId: product.seller_id,
        buyerId: user?.id,
        deliveryMethod
      });

      const { data: currentProduct, error: productCheckError } = await supabase
        .from('products')
        .select('status, delivery_price')
        .eq('id', product.id)
        .single();
        
      if (productCheckError) {
        console.error('❌ Error checking product status:', productCheckError);
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
        // Получаем изображения товара
        const { data: productImagesData, error: productImagesError } = await supabase
          .from('product_images')
          .select('url')
          .eq('product_id', product.id);
          
        if (productImagesError) {
          console.error('⚠️ Error fetching product images:', productImagesError);
        } else if (productImagesData && productImagesData.length > 0) {
          productImages = productImagesData.map(img => img.url);
          console.log('📸 Found product images:', productImages.length);
        }
      }

      // Получаем видео товара
      let productVideos: string[] = [];
      
      if (product.id) {
        const { data: productVideosData, error: productVideosError } = await supabase
          .from('product_videos')
          .select('url')
          .eq('product_id', product.id);
          
        if (productVideosError) {
          console.error('⚠️ Error fetching product videos:', productVideosError);
        } else if (productVideosData && productVideosData.length > 0) {
          productVideos = productVideosData.map(video => video.url);
          console.log('🎥 Found product videos:', productVideos.length);
        }
      }

      console.log('💰 Product delivery price:', currentProduct.delivery_price);

      // Правильная обработка brand и model - передаем null если поля пустые
      const brandValue = product.brand && product.brand.trim() ? product.brand : null;
      const modelValue = product.model && product.model.trim() ? product.model : null;

      console.log('🔄 Calling create_user_order RPC function with all parameters...');

      // Подготавливаем параметры для RPC вызова
      const rpcParams = {
        p_title: product.title,
        p_price: product.price,
        p_place_number: 1,
        p_seller_id: product.seller_id,
        p_order_seller_name: product.seller_name || "Unknown Seller",
        p_seller_opt_id: product.optid_created || null,
        p_buyer_id: user?.id,
        p_brand: brandValue,
        p_model: modelValue,
        p_status: 'created' as OrderStatus,
        p_order_created_type: 'ads_order' as OrderCreatedType,
        p_telegram_url_order: profile?.telegram || null,
        p_images: productImages,
        p_video_url: productVideos, // Добавляем обратно недостающий параметр
        p_product_id: product.id,
        p_delivery_method: deliveryMethod,
        p_text_order: orderData.text_order || null,
        p_delivery_price_confirm: currentProduct.delivery_price,
        p_quantity: 1,
        p_description: product.description || null,
        p_buyer_opt_id: profile?.opt_id || null,
        p_lot_number_order: lotNumberOrder,
        p_telegram_url_buyer: profile?.telegram || null
      };

      console.log('📋 RPC Parameters:', rpcParams);

      // Используем RPC функцию create_user_order С видео параметром
      const { data: orderId, error: orderError } = await supabase
        .rpc('create_user_order', rpcParams);

      if (orderError) {
        console.error('❌ RPC Error creating order:', orderError);
        console.error('❌ RPC Error details:', {
          code: orderError.code,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint
        });
        
        // Более детальная обработка ошибок RPC
        let errorMessage = "Не удалось создать заказ. Попробуйте позже.";
        
        if (orderError.message?.includes('permission') || orderError.message?.includes('access')) {
          errorMessage = "Недостаточно прав для создания заказа. Обратитесь к администратору.";
        } else if (orderError.message?.includes('duplicate')) {
          errorMessage = "Для этого товара уже существует активный заказ";
        } else if (orderError.message?.includes('function') || orderError.message?.includes('not found')) {
          errorMessage = "Системная ошибка. Обратитесь к администратору.";
        } else if (orderError.message?.includes('parameter')) {
          errorMessage = "Ошибка в параметрах заказа. Попробуйте еще раз.";
        }
        
        toast({
          title: "Ошибка создания заказа",
          description: errorMessage,
          variant: "destructive",
        });
        throw orderError;
      }

      console.log('✅ Order created successfully with ID:', orderId);

      // Получаем данные созданного заказа для отправки уведомления и отображения номера
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("⚠️ Error fetching created order:", fetchError);
      } else {
        // Отправляем уведомление о создании заказа в Telegram
        try {
          console.log('📱 Sending order notification...');
          const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              order: createdOrder,
              action: 'create'
            }
          });

          if (notificationError) {
            console.error('⚠️ Error sending order notification:', notificationError);
          } else {
            console.log('✅ Order notification sent successfully');
          }
        } catch (notificationError) {
          console.error('💥 Error calling notification function:', notificationError);
        }
      }

      // Обработка успешного создания заказа
      if (deliveryMethod === 'self_pickup' && createdOrder) {
        setOrderNumber(createdOrder.order_number);
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
          window.location.href = getOrdersPageRoute();
        }, 1500);
      }
    } catch (error) {
      console.error('💥 Error handling order:', error);
      
      // Более детальная обработка ошибок
      let errorMessage = "Не удалось создать заказ. Попробуйте позже.";
      
      if (error instanceof Error) {
        // Проверяем специфичные ошибки
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = "Для этого товара уже существует активный заказ";
        } else if (error.message.includes('not found')) {
          errorMessage = "Товар не найден или был удален";
        } else if (error.message.includes('permission') || error.message.includes('access')) {
          errorMessage = "Недостаточно прав для создания заказа";
        } else if (error.message.includes('parameter')) {
          errorMessage = "Ошибка в параметрах заказа";
        }
      }
      
      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    window.location.href = getOrdersPageRoute();
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
          onClick={() => handleContactAction('telegram', onContactTelegram)}
        >
          <MessageSquare className="mr-2 h-5 w-5" /> Telegram
        </Button>

        <Button 
          className="bg-[#25d366] hover:bg-[#20bd5c] text-white shadow-lg"
          size="lg"
          onClick={() => handleContactAction('whatsapp', onContactWhatsApp)}
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

      <CommunicationWarningDialog
        open={showCommunicationWarning}
        onOpenChange={setShowCommunicationWarning}
        onProceed={handleCommunicationProceed}
        communicationRating={sellerCommunicationRating}
        productTitle={product.title}
        productPrice={product.price}
        lotNumber={typeof product.lot_number === 'number' ? product.lot_number : null}
        contactType={pendingContactType || 'telegram'}
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
