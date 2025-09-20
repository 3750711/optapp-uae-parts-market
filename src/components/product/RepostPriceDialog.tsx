import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";
import { normalizeDecimal } from '@/utils/number';

interface RepostPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice: number;
  onConfirm: (newPrice?: number) => void;
  isSubmitting: boolean;
  productTitle: string;
}

const RepostPriceDialog: React.FC<RepostPriceDialogProps> = ({
  open,
  onOpenChange,
  currentPrice,
  onConfirm,
  isSubmitting,
  productTitle,
}) => {
  const [price, setPrice] = useState("");
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  // Reset price when dialog opens
  useEffect(() => {
    if (open && currentPrice) {
      setPrice(currentPrice.toString());
    }
  }, [open, currentPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = normalizeDecimal(price);
    
    if (isNaN(numPrice) || numPrice < 0) {
      return;
    }
    
    // If price unchanged, call without argument
    if (numPrice === currentPrice) {
      onConfirm();
    } else {
      onConfirm(numPrice);
    }
  };

  const isPriceChanged = normalizeDecimal(price) !== currentPrice;
  const isValidPrice = !isNaN(normalizeDecimal(price)) && normalizeDecimal(price) >= 0;

  return (
    <MobileKeyboardOptimizedDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={t.repostPriceDialog.title}
      className="max-w-sm sm:max-w-md" // Адаптивный размер диалога
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogDescription className="text-sm text-muted-foreground">
          {t.repostPriceDialog.description}
        </DialogDescription>

        <div className="space-y-4">
          <div>
            <Label htmlFor="price" className="text-sm font-medium">
              {t.repostPriceDialog.priceLabel}
            </Label>
            <TouchOptimizedInput
              id="price"
              type="number"
              value={price}
              onChange={handlePriceChange}
              min="0"
              step="1"
              inputMode="numeric"
              className="mt-1 text-lg w-full h-12 sm:h-10" // Увеличенная touch-зона на мобильных
              disabled={isSubmitting}
            />
          </div>

        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 sm:h-10 touch-target" // Адаптивные размеры кнопок
          >
            {t.repostPriceDialog.cancel}
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto h-12 sm:h-10 touch-target" // Адаптивные размеры кнопок
            disabled={isSubmitting || !isValidPrice}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                {t.actions.sending}
              </>
            ) : (
              t.repostPriceDialog.sendRepost
            )}
          </Button>
        </DialogFooter>
      </form>
    </MobileKeyboardOptimizedDialog>
  );
};

export default RepostPriceDialog;
