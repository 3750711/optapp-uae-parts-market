import { useState } from "react";
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
import { useCreatePriceOffer } from "@/hooks/use-price-offers";
import { CreatePriceOfferData } from "@/types/price-offer";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  sellerId: string;
  currentPrice: number;
  productTitle: string;
}

interface FormData {
  offered_price: string;
  message: string;
}

export const MakeOfferModal = ({
  isOpen,
  onClose,
  productId,
  sellerId,
  currentPrice,
  productTitle,
}: MakeOfferModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOffer = useCreatePriceOffer();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      offered_price: "",
      message: "",
    },
  });

  const offeredPrice = watch("offered_price");
  const numericOfferedPrice = parseFloat(offeredPrice) || 0;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const offerData: CreatePriceOfferData = {
        product_id: productId,
        seller_id: sellerId,
        original_price: currentPrice,
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Товар</Label>
            <p className="text-sm text-muted-foreground mt-1">{productTitle}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Текущая цена</Label>
            <p className="text-lg font-bold mt-1">₽{currentPrice.toLocaleString()}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="offered_price">Ваше предложение *</Label>
              <Input
                id="offered_price"
                type="number"
                step="0.01"
                min="1"
                max={currentPrice}
                placeholder="Введите предлагаемую цену"
                {...register("offered_price", {
                  required: "Введите предлагаемую цену",
                  min: {
                    value: 1,
                    message: "Цена должна быть больше 0",
                  },
                  max: {
                    value: currentPrice,
                    message: "Цена не может быть больше текущей",
                  },
                })}
              />
              {errors.offered_price && (
                <p className="text-sm text-destructive mt-1">
                  {errors.offered_price.message}
                </p>
              )}
              {numericOfferedPrice > 0 && numericOfferedPrice <= currentPrice && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p>Экономия: ₽{(currentPrice - numericOfferedPrice).toLocaleString()}</p>
                  <p>Скидка: {(((currentPrice - numericOfferedPrice) / currentPrice) * 100).toFixed(1)}%</p>
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

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
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
                disabled={isSubmitting || !offeredPrice}
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