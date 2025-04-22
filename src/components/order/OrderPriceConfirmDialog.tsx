
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
  isSubmitting
}) => {
  const [price, setPrice] = useState(currentPrice);
  const [isChecked, setIsChecked] = useState(false);
  const isPriceUnchanged = price === currentPrice;

  // Reset price and checkbox when dialog opens
  useEffect(() => {
    if (open) {
      setPrice(currentPrice);
      setIsChecked(false);
    }
  }, [open, currentPrice]);

  const handleConfirm = () => {
    if (isPriceUnchanged && !isChecked) {
      return; // Prevent confirmation if price unchanged and checkbox unchecked
    }
    onConfirm(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Подтверждение стоимости</DialogTitle>
          <DialogDescription>
            Проверьте стоимость, возможно вы договаривались о цене. Если цена не верна, впишите нужную.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Введите стоимость"
            />
          </div>
          {isPriceUnchanged && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noAgreement"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
              />
              <label
                htmlFor="noAgreement"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Я не договаривался с покупателем о цене
              </label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || (isPriceUnchanged && !isChecked)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              "Подтвердить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPriceConfirmDialog;
