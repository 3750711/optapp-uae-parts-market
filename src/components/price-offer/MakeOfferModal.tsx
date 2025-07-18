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
import { AlertCircle, Star, Shield, MapPin } from "lucide-react";
import { useCreatePriceOffer } from "@/hooks/use-price-offers";
import { CreatePriceOfferData } from "@/types/price-offer";
import { checkProductStatus } from "@/utils/productStatusChecker";
import { Product } from "@/types/product";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
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
}: MakeOfferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productStatus, setProductStatus] = useState<{ isAvailable: boolean; status: string } | null>(null);
  const createOffer = useCreatePriceOffer();

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      offered_price: "",
      message: "",
      confirmation: false,
    },
  });

  const offeredPrice = watch("offered_price");
  const confirmation = watch("confirmation");
  const numericOfferedPrice = parseFloat(offeredPrice) || 0;

  const onSubmit = async (data: FormData) => {
    if (!data.confirmation) {
      return;
    }

    // Recheck product status before submitting
    try {
      const status = await checkProductStatus(product.id);
      if (!status.isAvailable) {
        return; // Error will be shown in UI
      }
    } catch (error) {
      console.error("Error checking product status:", error);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const offerData: CreatePriceOfferData = {
        product_id: product.id,
        seller_id: product.seller_id,
        original_price: product.price,
        offered_price: parseFloat(data.offered_price),
        message: data.message || undefined,
      };

      await createOffer.mutateAsync(offerData);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                      product.product_images?.[0]?.url;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
        </DialogHeader>

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
                step="0.01"
                min="1"
                max={product.price}
                placeholder="Введите предлагаемую цену в долларах"
                {...register("offered_price", {
                  required: "Введите предлагаемую цену",
                  min: {
                    value: 1,
                    message: "Цена должна быть больше 0",
                  },
                  max: {
                    value: product.price,
                    message: "Цена не может быть больше текущей",
                  },
                })}
              />
              {errors.offered_price && (
                <p className="text-sm text-destructive mt-1">
                  {errors.offered_price.message}
                </p>
              )}
              {numericOfferedPrice > 0 && numericOfferedPrice <= product.price && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-700">Экономия: ${(product.price - numericOfferedPrice).toLocaleString()}</p>
                  <p className="text-green-700">Скидка: {(((product.price - numericOfferedPrice) / product.price) * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="message">Сообщение продавцу (необязательно)</Label>
              <Textarea
                id="message"
                placeholder="Дополнительная информация или обоснование цены..."
                rows={3}
                {...register("message")}
              />
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox
                  id="confirmation"
                  checked={confirmation}
                  onCheckedChange={(checked) => setValue("confirmation", checked as boolean)}
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
                disabled={isSubmitting}
                className="flex-1"
              >
                Отменить
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !offeredPrice || !confirmation || (productStatus && !productStatus.isAvailable)}
                className="flex-1"
              >
                {isSubmitting ? "Отправка..." : "Отправить предложение"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};