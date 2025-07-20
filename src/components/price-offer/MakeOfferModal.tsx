
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Star, Shield, Users, Award } from "lucide-react";
import { useCreatePriceOffer, useUpdateOfferPrice, useCompetitiveOffers } from "@/hooks/use-price-offers";
import { CreatePriceOfferData } from "@/types/price-offer";
import { checkProductStatus } from "@/utils/productStatusChecker";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import OrderConfirmationDialog from "@/components/order/OrderConfirmationDialog";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { OfferCountdown } from "./OfferCountdown";
import { LeadingOfferBanner } from "./LeadingOfferBanner";
import { BlitzPriceSection } from "./BlitzPriceSection";
import { ProductInfoCard } from "./ProductInfoCard";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingOffer?: {
    id: string;
    offered_price: number;
    status: string;
    expires_at: string;
    message?: string;
  };
}

interface FormData {
  offered_price: string;
  message: string;
  confirmation: boolean;
}

export const MakeOfferModal = ({
  isOpen,
  onClose,
  product,
  existingOffer,
}: MakeOfferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productStatus, setProductStatus] = useState<{ isAvailable: boolean; status: string } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<Database["public"]["Enums"]["delivery_method"]>('cargo_rf');
  
  const createOffer = useCreatePriceOffer();
  const updateOffer = useUpdateOfferPrice();
  const isLoading = createOffer.isPending || updateOffer.isPending;
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  
  // Load competitive offers data
  const { data: competitiveData, isLoading: competitiveLoading } = useCompetitiveOffers(product.id, isOpen);
  
  const isUpdateMode = !!existingOffer;

  // Check product status when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      checkProductStatus(product.id).then(setProductStatus).catch(console.error);
    }
  }, [isOpen, product?.id]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      offered_price: "",
      message: "",
      confirmation: false,
    },
  });

  const minPrice = isUpdateMode ? (existingOffer?.offered_price || 0) + 1 : 1;
  const maxPrice = product.price;

  // Calculate smart recommendations
  const getRecommendedPrice = () => {
    if (!competitiveData) return null;
    
    if (isUpdateMode) {
      if (!competitiveData.current_user_is_max && competitiveData.max_offer_price > 0) {
        return competitiveData.max_offer_price + 1;
      }
      return (existingOffer?.offered_price || 0) + 1;
    } else {
      if (competitiveData.max_offer_price > 0) {
        return competitiveData.max_offer_price + 1;
      }
      return Math.min(Math.ceil(product.price * 0.8), product.price);
    }
  };

  const recommendedPrice = getRecommendedPrice();

  const handleQuickFillRecommended = () => {
    if (recommendedPrice) {
      setValue("offered_price", recommendedPrice.toString());
    }
  };

  const handleBuyNow = () => {
    setShowOrderDialog(true);
  };

  const handleOrderConfirm = async (orderData: { text_order?: string }) => {
    // Здесь будет логика создания заказа
    console.log("Creating order:", orderData);
    setShowOrderDialog(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if ((!isUpdateMode && !isConfirmed) || !data.offered_price) {
      return;
    }

    const offeredPrice = parseFloat(data.offered_price);
    if (isNaN(offeredPrice) || offeredPrice <= 0) {
      return;
    }

    if (isUpdateMode && offeredPrice <= (existingOffer?.offered_price || 0)) {
      return;
    }

    if (!isUpdateMode && offeredPrice > product.price) {
      return;
    }

    setIsSubmitting(true);

    try {
      const status = await checkProductStatus(product.id);
      if (!status.isAvailable) {
        setProductStatus(status);
        setIsSubmitting(false);
        return;
      }

      const offerData: CreatePriceOfferData = {
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: offeredPrice,
        message: isUpdateMode ? existingOffer?.message : (data.message || undefined),
      };

      if (isUpdateMode && existingOffer) {
        await updateOffer.mutateAsync({
          offerId: existingOffer.id,
          newPrice: offeredPrice,
          originalMessage: existingOffer.message,
          productId: product.id, // Add productId for optimistic updates
        });
      } else {
        await createOffer.mutateAsync(offerData);
      }

      handleClose();
    } catch (error) {
      console.error("Error submitting offer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    reset();
    onClose();
  };

  // Competitive offers info component
  const CompetitiveOffersInfo = () => {
    if (competitiveLoading) {
      return (
        <div className="bg-gray-50 p-3 rounded-lg border animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      );
    }

    if (!competitiveData) return null;

    const hasCompetitors = competitiveData.total_offers_count > (isUpdateMode ? 1 : 0);
    const userIsLeading = isUpdateMode ? competitiveData.current_user_is_max : false;
    const maxCompetitorPrice = competitiveData.max_offer_price;

    return (
      <div className="space-y-3">
        {/* Leading offer banner */}
        {userIsLeading && (
          <LeadingOfferBanner compact={isMobile} />
        )}

        {/* Countdown timer */}
        {existingOffer && (
          <OfferCountdown expiresAt={existingOffer.expires_at} compact={isMobile} />
        )}

        {/* Competitive info */}
        <div className={`p-3 rounded-lg border ${
          isMobile ? 'space-y-2' : 'space-y-3'
        } ${userIsLeading ? 'bg-green-50 border-green-200' : hasCompetitors ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <Award className={`h-4 w-4 ${
              userIsLeading ? 'text-green-600' : hasCompetitors ? 'text-orange-600' : 'text-blue-600'
            }`} />
            <h3 className={`font-medium text-sm ${
              userIsLeading ? 'text-green-800' : hasCompetitors ? 'text-orange-800' : 'text-blue-800'
            }`}>
              Информация о ставках
            </h3>
          </div>

          <div className={`space-y-2 text-xs ${isMobile ? '' : 'text-sm'}`}>
            {isUpdateMode && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ваша текущая ставка:</span>
                <span className="font-semibold">${existingOffer?.offered_price}</span>
              </div>
            )}

            {hasCompetitors && maxCompetitorPrice > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Максимальная ставка конкурента:</span>
                <span className="font-semibold text-orange-600">${maxCompetitorPrice}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Всего предложений:</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-semibold">{competitiveData.total_offers_count}</span>
              </div>
            </div>

            {/* Smart recommendation */}
            {recommendedPrice && !userIsLeading && hasCompetitors && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                <p className="text-yellow-800 font-medium text-xs">
                  💡 Предложите больше ${recommendedPrice}, чтобы обойти конкурента
                </p>
                {!isMobile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleQuickFillRecommended}
                    className="mt-2 h-6 text-xs bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                  >
                    Использовать рекомендуемую сумму
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Mobile-specific component
  const MobileContent = () => (
    <div className="space-y-3 pb-4">
      {/* Compact Product Info for Mobile */}
      <ProductInfoCard product={product} compact={true} />

      {/* Competitive Offers Info */}
      <CompetitiveOffersInfo />

      {/* Blitz Price Section */}
      <BlitzPriceSection 
        price={product.price}
        onBuyNow={handleBuyNow}
        disabled={isSubmitting || isLoading}
        compact={true}
      />

      {/* Seller Information */}
      {product.profiles && (
        <div className="bg-purple-50 p-2 rounded border border-purple-200">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-3 w-3 text-purple-600" />
            <span className="font-medium">{product.profiles.full_name || product.seller_name}</span>
            {product.profiles.rating && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span>{product.profiles.rating}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {productStatus && !productStatus.isAvailable && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">
            Товар недоступен. Статус: {productStatus.status}
          </p>
        </div>
      )}

      {/* Offer Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Label htmlFor="offered_price" className="text-sm font-medium">Ваше предложение *</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="offered_price"
              type="number"
              step="1"
              min={minPrice}
              max={isUpdateMode ? undefined : maxPrice}
              placeholder={isUpdateMode ? `Мин. ${minPrice}$` : `Макс. ${maxPrice}$`}
              className="text-base h-10 modal-input-field"
              inputMode="numeric"
              {...register("offered_price", {
                required: "Введите предлагаемую цену",
                min: {
                  value: minPrice,
                  message: isUpdateMode 
                    ? `Цена должна быть больше ${existingOffer?.offered_price}$`
                    : "Цена должна быть больше 0",
                },
                ...(isUpdateMode ? {} : {
                  max: {
                    value: maxPrice,
                    message: `Цена не може быть больше ${maxPrice}$`,
                  }
                }),
                valueAsNumber: true,
              })}
            />
            {recommendedPrice && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickFillRecommended}
                className="text-xs px-2 whitespace-nowrap"
              >
                ${recommendedPrice}
              </Button>
            )}
          </div>
          {errors.offered_price && (
            <p className="text-xs text-destructive mt-1">
              {errors.offered_price.message}
            </p>
          )}
        </div>

        {!isUpdateMode && (
          <div>
            <Label htmlFor="message" className="text-sm font-medium">Сообщение продавцу</Label>
            <Textarea
              id="message"
              placeholder="Дополнительная информация..."
              rows={2}
              className="mt-1 text-sm"
              {...register("message")}
            />
          </div>
        )}

        {isUpdateMode && existingOffer?.message && (
          <div className="p-2 bg-gray-50 border rounded">
            <Label className="text-xs font-medium text-gray-600">Оригинальное сообщение (будет сохранено)</Label>
            <p className="text-xs text-gray-700 mt-1">{existingOffer.message}</p>
          </div>
        )}

        {/* Compact Confirmation */}
        {!isUpdateMode && (
          <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <Checkbox
              id="confirmation"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="confirmation" 
              className="text-xs text-yellow-800 cursor-pointer leading-tight"
            >
              Согласен на автоматическое оформление заказа при подтверждении продавцом
            </Label>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || (!isUpdateMode && !isConfirmed) || (productStatus && !productStatus.isAvailable)}
            className="w-full h-10 text-sm font-medium"
          >
            {(isSubmitting || isLoading) ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isUpdateMode ? "Обновление..." : "Отправка..."}
              </div>
            ) : (
              isUpdateMode ? "Обновить предложение" : "Отправить предложение"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="w-full h-8 text-sm"
          >
            Отменить
          </Button>
        </div>
      </form>
    </div>
  );

  // Desktop content component  
  const DesktopContent = () => (
    <div className="space-y-6">
      {/* Product Information Section */}
      <ProductInfoCard product={product} />

      {/* Competitive Offers Info */}
      <CompetitiveOffersInfo />

      {/* Seller Information Section */}
      {product.profiles && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-600" />
            Информация о продавце
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Имя:</span> {product.profiles.full_name || product.seller_name}</p>
            {product.profiles.rating && (
              <p className="flex items-center gap-1">
                <span className="font-medium">Рейтинг:</span>
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{product.profiles.rating}</span>
              </p>
            )}
            {product.profiles.opt_status && (
              <p>
                <span className="font-medium">Статус:</span>{" "}
                <span className={`px-2 py-1 rounded text-xs ${
                  product.profiles.opt_status === 'opt_user' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.profiles.opt_status === 'opt_user' ? 'OPT пользователь' : 'Обычный пользователь'}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Blitz Price Section */}
      <BlitzPriceSection 
        price={product.price}
        onBuyNow={handleBuyNow}
        disabled={isSubmitting || isLoading}
      />

      {productStatus && !productStatus.isAvailable && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">
            Товар недоступен для предложений. Статус: {productStatus.status}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="offered_price">Ваше предложение *</Label>
          <div className="flex gap-3 mt-1">
            <Input
              id="offered_price"
              type="number"
              step="1"
              min={minPrice}
              max={isUpdateMode ? undefined : maxPrice}
              placeholder="Введите предлагаемую цену в долларах"
              className="flex-1"
              {...register("offered_price", {
                required: "Введите предлагаемую цену",
                min: {
                  value: minPrice,
                  message: isUpdateMode 
                    ? `Цена должна быть больше ${existingOffer?.offered_price}$`
                    : "Цена должна быть больше 0",
                },
                ...(isUpdateMode ? {} : {
                  max: {
                    value: maxPrice,
                    message: "Цена не может быть больше текущей",
                  }
                }),
              })}
            />
            {recommendedPrice && (
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickFillRecommended}
                className="px-4"
              >
                Обойти конкурента (${recommendedPrice})
              </Button>
            )}
          </div>
          {errors.offered_price && (
            <p className="text-sm text-destructive mt-1">
              {errors.offered_price.message}
            </p>
          )}
        </div>

        {!isUpdateMode && (
          <div>
            <Label htmlFor="message">Сообщение продавцу (необязательно)</Label>
            <Textarea
              id="message"
              placeholder="Дополнительная информация или обоснование цены..."
              rows={3}
              {...register("message")}
            />
          </div>
        )}

        {isUpdateMode && existingOffer?.message && (
          <div className="p-3 bg-gray-50 border rounded-lg">
            <Label className="text-sm font-medium text-gray-600">Оригинальное сообщение (будет сохранено)</Label>
            <p className="text-sm text-gray-700 mt-1">{existingOffer.message}</p>
          </div>
        )}

        {/* Mandatory Confirmation Checkbox */}
        {!isUpdateMode && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Checkbox
                id="confirmation"
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="confirmation" 
                  className="text-sm font-medium text-yellow-800 cursor-pointer leading-5"
                >
                  Я ознакомился с товаром, оценил его состояние и согласен, что при подтверждении продавцом моего предложения заказ будет автоматически оформлен за предложенную цену
                </Label>
                <p className="text-xs text-yellow-700">
                  Это подтверждение обязательно для отправки предложения
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded border">
          <p>• Предложение действует 6 часов</p>
          <p>• Продавец может принять или отклонить предложение</p>
          <p>• У вас может быть только одно активное предложение на товар</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            className="flex-1"
          >
            Отменить
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || (!isUpdateMode && !isConfirmed) || (productStatus && !productStatus.isAvailable)}
            className="flex-1"
          >
            {(isSubmitting || isLoading) ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isUpdateMode ? "Обновление..." : "Отправка..."}
              </div>
            ) : (
              isUpdateMode ? "Обновить предложение" : "Отправить предложение"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileKeyboardOptimizedDialog
          open={isOpen}
          onOpenChange={handleClose}
          title={isUpdateMode ? "Изменить предложение" : "Предложить цену"}
          className="max-w-md"
        >
          <MobileContent />
        </MobileKeyboardOptimizedDialog>

        <OrderConfirmationDialog
          open={showOrderDialog}
          onOpenChange={setShowOrderDialog}
          onConfirm={handleOrderConfirm}
          isSubmitting={false}
          product={product}
          profile={profile}
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={setDeliveryMethod}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isUpdateMode ? "Изменить предложение" : "Предложить цену"}</DialogTitle>
          </DialogHeader>
          <DesktopContent />
        </DialogContent>
      </Dialog>

      <OrderConfirmationDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        onConfirm={handleOrderConfirm}
        isSubmitting={false}
        product={product}
        profile={profile}
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={setDeliveryMethod}
      />
    </>
  );
};
