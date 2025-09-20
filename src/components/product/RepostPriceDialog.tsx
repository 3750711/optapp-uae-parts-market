import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";
import { getProductStatusTranslations } from '@/utils/translations/productStatuses';
import { useLanguage } from '@/hooks/useLanguage';
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
  const [keepCurrentPrice, setKeepCurrentPrice] = useState(true);
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  // Reset price and checkbox when dialog opens or currentPrice changes
  useEffect(() => {
    if (open && currentPrice) {
      setPrice(currentPrice.toString());
      setKeepCurrentPrice(true);
    }
  }, [open, currentPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value);
    // Uncheck "keep current price" when price changes
    if (value !== currentPrice.toString()) {
      setKeepCurrentPrice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (keepCurrentPrice) {
      // Send repost with current price (no price change)
      onConfirm();
      return;
    }

    // Validate new price
    const normalizedPrice = normalizeDecimal(price);
    
    if (isNaN(normalizedPrice) || normalizedPrice <= 0) {
      return;
    }

    // Send repost with new price
    onConfirm(normalizedPrice);
  };

  const priceChanged = !keepCurrentPrice && price !== currentPrice.toString();
  const normalizedInputPrice = normalizeDecimal(price);
  const isValid = keepCurrentPrice || (!isNaN(normalizedInputPrice) && normalizedInputPrice > 0);

  return (
    <MobileKeyboardOptimizedDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.repostPriceDialog.title}
      className="max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogDescription>
          {t.repostPriceDialog.description}
        </DialogDescription>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {productTitle}
            </Label>
          </div>

          <div>
            <Label htmlFor="current-price" className="text-sm font-medium">
              {t.repostPriceDialog.currentPrice}
            </Label>
            <div className="mt-1 text-lg font-semibold">
              ${currentPrice}
            </div>
          </div>

          <div>
            <Label htmlFor="new-price" className="text-sm font-medium">
              {t.repostPriceDialog.newPrice}
            </Label>
            <TouchOptimizedInput
              id="new-price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={handlePriceChange}
              disabled={keepCurrentPrice || isSubmitting}
              className="mt-1"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="keep-current-price"
              checked={keepCurrentPrice}
              onCheckedChange={(checked) => {
                setKeepCurrentPrice(!!checked);
                if (checked) {
                  setPrice(currentPrice.toString());
                }
              }}
              disabled={isSubmitting}
            />
            <Label htmlFor="keep-current-price" className="text-sm">
              {t.repostPriceDialog.keepCurrentPrice}
            </Label>
          </div>

          {priceChanged && (
            <div className="text-sm text-green-600 font-medium">
              {t.repostPriceDialog.priceChanged}: ${price}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t.repostPriceDialog.cancel}
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
