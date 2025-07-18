import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Star, Shield, MapPin } from "lucide-react";
import { useCreatePriceOffer, useUpdateOfferPrice } from "@/hooks/use-price-offers";
import { CreatePriceOfferData } from "@/types/price-offer";
import { checkProductStatus } from "@/utils/productStatusChecker";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const createOffer = useCreatePriceOffer();
  const updateOffer = useUpdateOfferPrice();
  const isLoading = createOffer.isPending || updateOffer.isPending;
  const isMobile = useIsMobile();
  
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

  const onSubmit = async (data: FormData) => {
    if ((!isUpdateMode && !isConfirmed) || !data.offered_price) {
      return;
    }

    const offeredPrice = parseFloat(data.offered_price);
    if (isNaN(offeredPrice) || offeredPrice <= 0) {
      return;
    }

    // Validation for update mode
    if (isUpdateMode && offeredPrice <= (existingOffer?.offered_price || 0)) {
      return;
    }

    // Validation for new offer mode
    if (!isUpdateMode && offeredPrice > product.price) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Check product availability before submitting
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
        // Update existing offer
        await updateOffer.mutateAsync({
          offerId: existingOffer.id,
          newPrice: offeredPrice,
          originalMessage: existingOffer.message,
        });
      } else {
        // Create new offer
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

  const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                      product.product_images?.[0]?.url;

  // Mobile-specific component
  const MobileContent = () => (
    <div className="space-y-3 pb-4">
      {/* Compact Product Info for Mobile */}
      <div className="bg-gray-50 p-3 rounded-lg border">
        <div className="flex gap-3">
          {primaryImage ? (
            <img 
              src={primaryImage} 
              alt={product.title}
              className="w-12 h-12 object-cover rounded-md border flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-md border flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500">Нет фото</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{product.title}</h3>
            <p className="text-xs text-muted-foreground">{product.brand} {product.model}</p>
            <p className="text-base font-bold text-green-600">${product.price.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Current Offer Info for Update Mode */}
      {isUpdateMode && existingOffer && (
        <div className="bg-orange-50 p-2 rounded border border-orange-200">
          <div className="text-xs">
            <span className="font-medium text-orange-800">Текущее предложение: ₽{existingOffer.offered_price}</span>
          </div>
        </div>
      )}

      {/* Compact Seller Info */}
      {product.profiles && (
        <div className="bg-blue-50 p-2 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-3 w-3 text-blue-600" />
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
          <Input
            id="offered_price"
            type="number"
            step="1"
            min={minPrice}
            max={isUpdateMode ? undefined : maxPrice}
            placeholder={isUpdateMode ? `Мин. ${minPrice}$` : `Макс. ${maxPrice}$`}
            className="text-base h-10 mt-1"
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
                  message: `Цена не может быть больше ${maxPrice}$`,
                }
              }),
              valueAsNumber: true,
            })}
          />
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

        <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded text-center">
          Предложение действует 6 часов
        </div>

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
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex gap-4">
          {/* Product Images */}
          <div className="flex-shrink-0">
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center">
                <span className="text-xs text-gray-500">Нет фото</span>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">{product.title}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Бренд:</span> {product.brand}</p>
              {product.model && <p><span className="font-medium">Модель:</span> {product.model}</p>}
              <p><span className="font-medium">Состояние:</span> {product.condition}</p>
              {product.product_location && (
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{product.product_location}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seller Information Section */}
      {product.profiles && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
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

      {/* Current Offer Info for Update Mode */}
      {isUpdateMode && existingOffer && (
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <Label className="text-sm font-medium text-orange-800">Ваше текущее предложение</Label>
          <p className="text-xl font-bold mt-1 text-orange-600">${existingOffer.offered_price.toLocaleString()}</p>
        </div>
      )}

      {/* Current Price */}
      <div>
        <Label className="text-sm font-medium">Текущая цена</Label>
        <p className="text-2xl font-bold mt-1 text-green-600">${product.price.toLocaleString()}</p>
      </div>

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
          <Input
            id="offered_price"
            type="number"
            step="1"
            min={minPrice}
            max={isUpdateMode ? undefined : maxPrice}
            placeholder="Введите предлагаемую цену в долларах"
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
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left pb-4">
            <DrawerTitle>{isUpdateMode ? "Изменить предложение" : "Предложить цену"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <MobileContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isUpdateMode ? "Изменить предложение" : "Предложить цену"}</DialogTitle>
        </DialogHeader>
        <DesktopContent />
      </DialogContent>
    </Dialog>
  );
};