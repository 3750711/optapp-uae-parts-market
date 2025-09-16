
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';
import { normalizeDecimal } from '@/utils/number';

interface OrderPriceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice: number;
  onConfirm: (newPrice: number) => void;
  isSubmitting: boolean;
}

const OrderPriceConfirmDialog: React.FC<OrderPriceConfirmDialogProps> = ({
  open,
  onOpenChange,
  currentPrice,
  onConfirm,
  isSubmitting,
}) => {
  const [price, setPrice] = useState("");
  const [noDiscountConfirmed, setNoDiscountConfirmed] = useState(false);
  const { language } = useLanguage();
  const t = getSellerOrdersTranslations(language);

  // Reset price and checkbox when dialog opens or currentPrice changes
  useEffect(() => {
    if (open && currentPrice) {
      setPrice(currentPrice.toString());
      setNoDiscountConfirmed(false);
    }
  }, [open, currentPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(value);
    // Reset checkbox when price changes
    if (value !== currentPrice.toString()) {
      setNoDiscountConfirmed(false);
    }
  };

  const handleSubmit = () => {
    const numPrice = normalizeDecimal(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return;
    }
    
    // Check if confirmation is needed
    if (numPrice === currentPrice && !noDiscountConfirmed) {
      return;
    }
    
    onConfirm(numPrice);
  };

  const isPriceUnchanged = normalizeDecimal(price) === currentPrice;

  return (
    <MobileKeyboardOptimizedDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={t.orderConfirmationTitle}
    >
      <DialogDescription className="mb-4">
        {t.orderConfirmationDescription}
      </DialogDescription>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price">{t.priceLabel}</Label>
            <TouchOptimizedInput
              id="price"
              type="number"
              value={price}
              onChange={handlePriceChange}
              min="0"
              step="1"
              inputMode="numeric"
              className="text-lg"
              placeholder="0"
            />
        </div>
        
        {isPriceUnchanged && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="noDiscount"
              checked={noDiscountConfirmed}
              onCheckedChange={(checked) => setNoDiscountConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="noDiscount"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t.noDiscountCheckbox}
            </Label>
          </div>
        )}
      </div>
      
      <DialogFooter className="pt-4 gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          {t.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          disabled={
            isSubmitting || 
            normalizeDecimal(price) <= 0 ||
            (isPriceUnchanged && !noDiscountConfirmed)
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              {t.confirming}
            </>
          ) : (
            t.confirm
          )}
        </Button>
      </DialogFooter>
    </MobileKeyboardOptimizedDialog>
  );
};

export default OrderPriceConfirmDialog;
