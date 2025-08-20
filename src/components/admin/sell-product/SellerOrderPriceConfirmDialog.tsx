import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileKeyboardOptimizedDialog } from "@/components/ui/MobileKeyboardOptimizedDialog";
import TouchOptimizedInput from "@/components/ui/TouchOptimizedInput";

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
    <MobileKeyboardOptimizedDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title="Price Confirmation"
    >
      <DialogDescription className="mb-4">
        If you negotiated a different price with the buyer, please specify the new price
      </DialogDescription>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productPrice">Product Price ($)</Label>
          <TouchOptimizedInput
            id="productPrice"
            type="number"
            value={productPrice}
            onChange={handlePriceChange}
            min="0"
            step="0.01"
            inputMode="decimal"
            className="text-lg"
            placeholder="Enter product price"
          />
        </div>
        
        {isPriceUnchanged && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="noPriceChange"
              checked={noPriceChangeConfirmed}
              onCheckedChange={(checked) => setNoPriceChangeConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="noPriceChange"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I did not negotiate a different price
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
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          disabled={
            isSubmitting || 
            parseFloat(productPrice) <= 0 || 
            isNaN(parseFloat(productPrice)) ||
            (isPriceUnchanged && !noPriceChangeConfirmed)
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Creating Order...
            </>
          ) : (
            <>Confirm & Create Order</>
          )}
        </Button>
      </DialogFooter>
    </MobileKeyboardOptimizedDialog>
  );
};

export default SellerOrderPriceConfirmDialog;