
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
import { AlertCircle, Info, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSafeOfferOperations } from "@/hooks/use-safe-offer-operations";
import { useOfferValidation } from "@/hooks/use-offer-validation";
import { CreatePriceOfferData } from "@/types/price-offer";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";

interface SafeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

interface FormData {
  offered_price: string;
  message: string;
  confirmation: boolean;
}

export const SafeOfferModal = ({
  isOpen,
  onClose,
  product,
}: SafeOfferModalProps) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showCancelOption, setShowCancelOption] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const { createOrUpdateOffer, cancelOfferAndCreate, isLoading } = useSafeOfferOperations();
  const { validateOfferCreation, isValidating } = useOfferValidation();

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

  // Валидация при открытии модала
  useEffect(() => {
    if (isOpen && user?.id) {
      validateOfferCreation(product.id, user.id).then(setValidationResult);
    }
  }, [isOpen, product.id, user?.id, validateOfferCreation]);

  const onSubmit = async (data: FormData) => {
    if (!data.confirmation && !validationResult?.existingOffer) {
      return;
    }

    const offeredPrice = parseFloat(data.offered_price);
    if (isNaN(offeredPrice) || offeredPrice <= 0) {
      return;
    }

    const offerData: CreatePriceOfferData = {
      product_id: product.id,
      seller_id: product.seller_id,
      original_price: product.price,
      offered_price: offeredPrice,
      message: data.message || undefined,
    };

    try {
      if (showCancelOption && validationResult?.existingOffer) {
        // Отменяем старое и создаем новое
        await cancelOfferAndCreate.mutateAsync({
          existingOfferId: validationResult.existingOffer.id,
          newOfferData: offerData
        });
      } else {
        // Создаем или обновляем
        await createOrUpdateOffer.mutateAsync(offerData);
      }
      
      handleClose();
    } catch (error) {
      // Ошибка обработается в хуке
      console.error("Submit error:", error);
    }
  };

  const handleClose = () => {
    reset();
    setValidationResult(null);
    setShowCancelOption(false);
    onClose();
  };

  const renderValidationAlert = () => {
    if (isValidating) {
      return (
        <Alert>
          <Clock className="h-4 w-4 animate-spin" />
          <AlertDescription>Проверяем существующие предложения...</AlertDescription>
        </Alert>
      );
    }

    if (!validationResult) return null;

    if (validationResult.existingOffer) {
      const isExpiringSoon = new Date(validationResult.existingOffer.expires_at).getTime() - Date.now() < 60 * 60 * 1000; // менее часа

      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="space-y-2">
            <p className="text-orange-700">
              У вас уже есть активное предложение: <strong>${validationResult.existingOffer.offered_price}</strong>
            </p>
            {isExpiringSoon && (
              <p className="text-sm text-orange-600">
                Предложение истекает через: {new Date(validationResult.existingOffer.expires_at).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelOption(!showCancelOption)}
              >
                {showCancelOption ? "Обновить существующее" : "Отменить и создать новое"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (validationResult.canCreateOffer) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Готово к созданию нового предложения
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {validationResult.validationMessage || "Невозможно создать предложение"}
        </AlertDescription>
      </Alert>
    );
  };

  const getSubmitButtonText = () => {
    if (isLoading) return "Обработка...";
    
    if (validationResult?.existingOffer) {
      return showCancelOption ? "Отменить и создать новое" : "Обновить предложение";
    }
    
    return "Отправить предложение";
  };

  const canSubmit = () => {
    if (isLoading || isValidating) return false;
    
    if (validationResult?.existingOffer) {
      return true; // Можем обновить или отменить и создать новое
    }
    
    return validationResult?.canCreateOffer;
  };

  const FormContent = () => (
    <div className="space-y-4">
      {renderValidationAlert()}

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

        {!validationResult?.existingOffer && (
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
            disabled={!canSubmit()}
            className="flex-1"
          >
            {getSubmitButtonText()}
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
