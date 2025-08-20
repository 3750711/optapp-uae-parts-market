import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";
import { PriceConfirmationStyles } from "./PriceConfirmationStyles";

interface SellerOrderPriceConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProductPrice: number;
  onConfirm: (newProductPrice: number) => void;
  isSubmitting: boolean;
}

const SellerOrderPriceConfirmDialog: React.FC<SellerOrderPriceConfirmDialogProps> = ({
  open,
  onOpenChange,
  currentProductPrice,
  onConfirm,
  isSubmitting,
}) => {
  const [productPrice, setProductPrice] = useState("");
  const [noPriceChangeConfirmed, setNoPriceChangeConfirmed] = useState(false);

  // Reset price and checkbox when dialog opens or currentProductPrice changes
  useEffect(() => {
    if (open && currentProductPrice) {
      setProductPrice(currentProductPrice.toString());
      setNoPriceChangeConfirmed(false);
    }
  }, [open, currentProductPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductPrice(value);
    // Reset checkbox when price changes
    if (value !== currentProductPrice.toString()) {
      setNoPriceChangeConfirmed(false);
    }
  };

  const handleSubmit = () => {
    const numPrice = parseFloat(productPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      return;
    }
    
    // Check if confirmation is needed
    if (numPrice === currentProductPrice && !noPriceChangeConfirmed) {
      return;
    }
    
    onConfirm(numPrice);
  };

  const isPriceUnchanged = parseFloat(productPrice) === currentProductPrice;

  return (
    <>
      <PriceConfirmationStyles />
      <MobileKeyboardOptimizedDialog 
        open={open} 
        onOpenChange={onOpenChange}
        title="Price Confirmation"
        className="price-confirmation-dialog"
      >
        <DialogDescription className="mb-4 text-sm text-muted-foreground">
          If you negotiated a different price with the buyer, please specify the new price
        </DialogDescription>
        
        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <Label 
              htmlFor="product-price"
              className="text-sm font-medium text-foreground"
            >
              Product Price
            </Label>
            <TouchOptimizedInput
              id="product-price"
              type="number"
              value={productPrice}
              onChange={handlePriceChange}
              min="0"
              step="0.01"
              inputMode="decimal"
              className="text-lg font-medium touch-target"
              placeholder="Enter product price"
              required
              aria-describedby={isPriceUnchanged ? "price-unchanged-help" : undefined}
            />
          </div>
        
          {isPriceUnchanged && (
            <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/50">
              <Checkbox 
                id="price-unchanged" 
                checked={noPriceChangeConfirmed}
                onCheckedChange={(checked) => setNoPriceChangeConfirmed(checked as boolean)}
                className="touch-target mt-0.5"
                aria-describedby="price-unchanged-help"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="price-unchanged" 
                  className="text-sm font-medium cursor-pointer touch-target"
                >
                  I did not negotiate a different price
                </Label>
                <p id="price-unchanged-help" className="text-xs text-muted-foreground mt-1">
                  Check this if the original price remains the same
                </p>
              </div>
            </div>
          )}
        
          <div className="flex space-x-3 pt-6 border-t bg-background/95 backdrop-blur-sm">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 touch-target min-h-[44px]"
              disabled={isSubmitting}
              aria-label="Cancel price confirmation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                parseFloat(productPrice) <= 0 || 
                isNaN(parseFloat(productPrice)) ||
                (isPriceUnchanged && !noPriceChangeConfirmed)
              }
              className="flex-1 touch-target min-h-[44px] font-medium"
              aria-label={isSubmitting ? "Creating order..." : "Confirm price and create order"}
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Creating...</span>
                </span>
              ) : (
                "Confirm & Create Order"
              )}
            </Button>
          </div>
        </div>
      </MobileKeyboardOptimizedDialog>
    </>
  );
};

export default SellerOrderPriceConfirmDialog;