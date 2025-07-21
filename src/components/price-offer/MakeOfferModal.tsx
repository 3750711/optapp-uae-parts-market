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
import { AlertCircle, ExternalLink, MapPin, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreatePriceOffer, useUpdatePriceOffer, useCompetitiveOffers } from "@/hooks/use-price-offers";
import { CreatePriceOfferData, PriceOffer } from "@/types/price-offer";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import { useProductImage } from "@/hooks/useProductImage";
import { CompetitorOfferBadge } from "./CompetitorOfferBadge";
import { BlitzPriceSection } from "./BlitzPriceSection";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ContactButtons from "@/components/product/ContactButtons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createOffer = useCreatePriceOffer();
  const updateOffer = useUpdatePriceOffer();
  const { primaryImage } = useProductImage(product);

  // Get competitive offers data
  const { data: competitiveData } = useCompetitiveOffers(product.id, !!user);
  const maxOtherOffer = Number(competitiveData?.max_offer_price) || 0;
  const suggestedPrice = maxOtherOffer > 0 ? Math.min(maxOtherOffer + 5, product.price) : Math.floor(product.price * 0.8);

  // Get seller profile data
  const { data: sellerProfile } = useQuery({
    queryKey: ['sellerProfile', product.seller_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.seller_id)
        .maybeSingle();
      return data;
    },
    enabled: !!product.seller_id,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      offered_price: existingOffer?.offered_price.toString() || suggestedPrice.toString(),
      message: existingOffer?.message || "",
      confirmation: false,
    },
  });

  const handleBuyNow = async () => {
    try {
      // Create direct order logic here
      toast({
        title: "Функция в разработке",
        description: "Прямая покупка будет доступна в ближайшее время",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ",
        variant: "destructive",
      });
    }
  };

  const handleSetSuggestedPrice = () => {
    setValue("offered_price", suggestedPrice.toString());
  };

  const handleViewProduct = () => {
    window.open(`/product/${product.id}`, '_blank');
  };

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
        await updateOffer.mutateAsync({
          offerId: existingOffer.id,
          data: {
            offered_price: offeredPrice,
            message: data.message || undefined,
          },
        });
      } else {
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
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Product Info Section */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{product.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.brand} {product.model}</p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline">{product.condition}</Badge>
              {product.product_location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {product.product_location}
                </Badge>
              )}
              {product.lot_number && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Лот #{product.lot_number}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Цена продавца:</span>
              <span className="font-semibold text-lg text-primary">${product.price}</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewProduct}
          className="w-full flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Подробнее о товаре
        </Button>
      </div>

      {/* Blitz Price Section */}
      <BlitzPriceSection
        price={product.price}
        onBuyNow={handleBuyNow}
        compact={true}
      />

      {/* Competitive Offers */}
      {maxOtherOffer > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-orange-800">Конкурентные предложения</h4>
            <CompetitorOfferBadge maxOtherOffer={maxOtherOffer} />
          </div>
          <p className="text-sm text-orange-700 mb-3">
            Наивысшее предложение: <strong>${maxOtherOffer}</strong>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetSuggestedPrice}
            className="w-full"
          >
            Предложить ${suggestedPrice} (рекомендуется)
          </Button>
        </div>
      )}

      {/* Existing Offer Alert */}
      {existingOffer && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            Обновление существующего предложения: <strong>${existingOffer.offered_price}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Offer Form */}
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

      {/* Seller Contact Section */}
      {sellerProfile && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Контакты продавца</h4>
          <ContactButtons
            sellerPhone={sellerProfile.phone}
            sellerTelegram={sellerProfile.telegram}
            productTitle={product.title}
            isVerified={sellerProfile.verification_status === 'verified'}
            verificationStatus={sellerProfile.verification_status}
          />
        </div>
      )}
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};
