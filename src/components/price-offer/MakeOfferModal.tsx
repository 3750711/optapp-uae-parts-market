
import React, { useState } from "react";
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreatePriceOffer, useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { CreatePriceOfferData, PriceOffer } from "@/types/price-offer";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingOffer?: PriceOffer;
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
  const isMobile = useIsMobile();
  const createOffer = useCreatePriceOffer();
  const updateOffer = useUpdatePriceOffer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      offered_price: existingOffer?.offered_price.toString() || "",
      message: existingOffer?.message || "",
      confirmation: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!data.confirmation && !existingOffer) {
      return;
    }

    const offeredPrice = parseFloat(data.offered_price);
    if (isNaN(offeredPrice) || offeredPrice <= 0) {
      return;
    }

    try {
      if (existingOffer) {
        // Update existing offer
        await updateOffer.mutateAsync({
          offerId: existingOffer.id,
          data: {
            offered_price: offeredPrice,
            message: data.message || undefined,
          },
        });
      } else {
        // Create new offer
        const offerData: CreatePriceOfferData = {
          product_id: product.id,
          seller_id: product.seller_id,
          original_price: product.price,
          offered_price: offeredPrice,
          message: data.message || undefined,
        };
        await createOffer.mutateAsync(offerData);
      }
      
      handleClose();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = createOffer.isPending || updateOffer.isPending;

  const FormContent = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">{product.title}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Цена продавца:</span>
          <span className="font-semibold text-primary">${product.price}</span>
        </div>
      </div>

      {existingOffer && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            Обновление существующего предложения: <strong>${existingOffer.offered_price}</strong>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="offered_price">Ваше предложение *</Label>
          <Input
            id="offered_price"
            type="number"
            step="1"
            min="1"
            max={product.price}
            placeholder={`Максимум ${product.price}$`}
            {...register("offered_price", {
              required: "Введите предлагаемую цену",
              min: { value: 1, message: "Цена должна быть больше 0" },
              max: { value: product.price, message: `Цена не может быть больше ${product.price}$` },
            })}
          />
          {errors.offered_price && (
            <p className="text-sm text-destructive mt-1">
              {errors.offered_price.message}
            </p>
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

        {!existingOffer && (
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Checkbox
              id="confirmation"
              {...register("confirmation", { required: true })}
            />
            <Label htmlFor="confirmation" className="text-sm leading-5 cursor-pointer">
              Я согласен на автоматическое оформление заказа при подтверждении продавцом
            </Label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Отменить
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Обработка..." : (existingOffer ? "Обновить предложение" : "Отправить предложение")}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <MobileKeyboardOptimizedDialog
        open={isOpen}
        onOpenChange={handleClose}
        title="Предложить цену"
        className="max-w-md"
      >
        <FormContent />
      </MobileKeyboardOptimizedDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};
