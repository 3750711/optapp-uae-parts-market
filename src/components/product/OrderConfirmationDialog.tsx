
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  product: {
    title: string;
    brand: string;
    model: string;
    price: number;
    description?: string;
    optid_created?: string | null;
    seller_id?: string;
    seller_name?: string;
  };
  profile?: {
    opt_id?: string;
    telegram?: string;
  } | null;
}

const OrderConfirmationDialog: React.FC<OrderConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  product,
  profile,
}) => {
  // Get seller name with fallback
  const sellerName = product.seller_name || 'Не указан';

  const orderDetails = {
    title: product.title,
    brand: product.brand,
    model: product.model,
    price: product.price,
    description: product.description,
    seller_id: product.seller_id,
    seller_name_order: sellerName,
    seller_opt_id: product.optid_created,
    buyer_opt_id: profile?.opt_id,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Подтверждение заказа</DialogTitle>
          <DialogDescription>
            Пожалуйста, проверьте детали вашего заказа
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Наименование:</div>
            <div>{orderDetails.title}</div>
            <div className="font-medium">Бренд:</div>
            <div>{orderDetails.brand}</div>
            <div className="font-medium">Модель:</div>
            <div>{orderDetails.model}</div>
            <div className="font-medium">Цена:</div>
            <div>{orderDetails.price} AED</div>
            <div className="font-medium">Количество:</div>
            <div>1</div>
            <div className="font-medium">Описание:</div>
            <div>{orderDetails.description || 'Не указано'}</div>
            <div className="font-medium">OPT ID продавца:</div>
            <div>{orderDetails.seller_opt_id || 'Не указан'}</div>
            <div className="font-medium">Продавец:</div>
            <div>{orderDetails.seller_name_order}</div>
            <div className="font-medium">Ваш OPT ID:</div>
            <div>{orderDetails.buyer_opt_id || 'Не указан'}</div>
            <div className="font-medium">Ваш Telegram:</div>
            <div>{profile?.telegram || 'Не указан'}</div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              "Подтвердить заказ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
