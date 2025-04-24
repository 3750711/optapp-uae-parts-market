
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return;
    }
    
    // Check if confirmation is needed
    if (numPrice === currentPrice && !noDiscountConfirmed) {
      return;
    }
    
    onConfirm(numPrice);
  };

  const isPriceUnchanged = parseFloat(price) === currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Подтверждение заказа</DialogTitle>
          <DialogDescription>
            Подтвердите или измените цену заказа
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="price">Подтвердите или измените цену ($)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={handlePriceChange}
              min="0"
              step="0.01"
              className="text-lg"
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
                Я не договаривался о скидке
              </Label>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={
              isSubmitting || 
              parseFloat(price) <= 0 || 
              isNaN(parseFloat(price)) ||
              (isPriceUnchanged && !noDiscountConfirmed)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                Подтверждение...
              </>
            ) : (
              <>Подтвердить</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPriceConfirmDialog;
