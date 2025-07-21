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

  // Form будет создана внутри FormContent для корректной работы

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

  // handleSetSuggestedPrice будет определена в FormContent

  const handleViewProduct = () => {
    window.open(`/product/${product.id}`, '_blank');
  };

  // onSubmit и handleClose будут определены в FormContent
  
  const handleClose = () => {
    onClose();
  };

  const isLoading = createOffer.isPending || updateOffer.isPending;

  const FormContent = () => {
    const {
      register,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: { errors },
    } = useForm<FormData>({
      defaultValues: {
        offered_price: existingOffer?.offered_price.toString() || suggestedPrice.toString(),
        message: existingOffer?.message || "",
        confirmation: false,
      },
    });

    const watchedPrice = watch("offered_price");
    const offeredPrice = parseFloat(watchedPrice || "0");
    const isUserBestOffer = offeredPrice > maxOtherOffer && offeredPrice <= product.price;
    const isOtherBestOffer = maxOtherOffer > 0 && (offeredPrice <= maxOtherOffer || offeredPrice > product.price);

    const handleSetSuggestedPrice = () => {
      setValue("offered_price", suggestedPrice.toString());
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
        reset();
      } catch (error) {
        console.error("Submit error:", error);
      }
    };

    return (
      <div className="space-y-3 max-h-[75vh] overflow-y-auto px-1">
        {/* Product Info Section */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex gap-3">
            <div 
              className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleViewProduct}
            >
              <img
                src={primaryImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-base text-gray-900 truncate cursor-pointer hover:text-primary transition-colors"
                onClick={handleViewProduct}
              >
                {product.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{product.brand} {product.model}</p>
              
              {sellerProfile && (
                <p className="text-sm text-gray-700 mb-2">
                  Продавец: <span className="font-medium">{sellerProfile.full_name || sellerProfile.email}</span>
                </p>
              )}
              
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="outline" className="text-xs">{product.condition}</Badge>
                {product.product_location && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {product.product_location}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blitz Price Section */}
        <BlitzPriceSection
          price={product.price}
          onBuyNow={handleBuyNow}
          compact={true}
        />

        {/* Price Comparison Section */}
        <div className="bg-background border rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-primary/10 rounded-lg border">
              <p className="text-primary font-medium">Цена продавца</p>
              <p className="text-lg font-bold text-primary">${product.price}</p>
            </div>
            {maxOtherOffer > 0 ? (
              <div className={`text-center p-2 rounded-lg border ${isOtherBestOffer ? 'bg-destructive/10 border-destructive/20' : 'bg-muted'}`}>
                <p className={`font-medium ${isOtherBestOffer ? 'text-destructive' : 'text-muted-foreground'}`}>
                  Лучшее предложение
                </p>
                <p className={`text-lg font-bold ${isOtherBestOffer ? 'text-destructive' : 'text-foreground'}`}>
                  ${maxOtherOffer}
                </p>
              </div>
            ) : (
              <div className="text-center p-2 bg-muted rounded-lg border">
                <p className="text-muted-foreground font-medium">Других предложений</p>
                <p className="text-lg font-bold text-foreground">нет</p>
              </div>
            )}
          </div>
          
          {maxOtherOffer > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetSuggestedPrice}
              className="w-full"
            >
              Предложить ${suggestedPrice} (рекомендуется)
            </Button>
          )}
        </div>

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
          <div className="relative">
            <Input
              id="offered_price"
              type="number"
              step="1"
              min="1"
              max={product.price}
              placeholder={`Максимум ${product.price}$`}
              className={`${isUserBestOffer ? 'border-green-500 bg-green-50' : ''} ${isOtherBestOffer ? 'border-red-500 bg-red-50' : ''}`}
              {...register("offered_price", {
                required: "Введите предлагаемую цену",
                min: { value: 1, message: "Цена должна быть больше 0" },
                max: { value: product.price, message: `Цена не может быть больше ${product.price}$` },
              })}
            />
            {isUserBestOffer && (
              <div className="absolute right-3 top-1/2 transform -y-1/2">
                <Badge variant="success" className="text-xs">Лучшее предложение!</Badge>
              </div>
            )}
          </div>
          {errors.offered_price && (
            <p className="text-sm text-destructive mt-1">
              {errors.offered_price.message}
            </p>
          )}
          {isOtherBestOffer && (
            <p className="text-sm text-red-600 mt-1">
              Ваше предложение меньше текущего лучшего (${maxOtherOffer})
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
  };

  if (isMobile) {
    return (
      <MobileKeyboardOptimizedDialog
        open={isOpen}
        onOpenChange={handleClose}
        title="Предложить цену"
        className="max-w-sm mx-2"
      >
        <FormContent />
      </MobileKeyboardOptimizedDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Предложить цену</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};
