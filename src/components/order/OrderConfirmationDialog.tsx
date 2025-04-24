import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  product: {
    id?: string; 
    title: string;
    brand: string;
    model: string;
    price: number;
    description?: string;
    optid_created?: string | null;
    seller_id?: string;
    seller_name?: string;
    lot_number?: string | number | null;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle>Подтверждение заказа</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Проверьте информацию перед подтверждением
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-3 sm:space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-sm mb-1.5">Информация о товаре</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Наименование:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{product.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Бренд:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Модель:</span>
                  <span className="font-medium">{product.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Цена:</span>
                  <span className="font-medium">{product.price} $</span>
                </div>
                {product.lot_number !== undefined && product.lot_number !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Номер лота:</span>
                    <span className="font-medium">{product.lot_number}</span>
                  </div>
                )}
                {product.id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">ID товара:</span>
                    <span className="font-medium text-right max-w-[60%] break-words">{product.id}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm mb-1.5">Информация о продавце</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Продавец:</span>
                  <span className="font-medium">{product.seller_name || 'Не указан'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">OPT ID:</span>
                  <span className="font-medium">{product.optid_created || 'Не указан'}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm mb-1.5">Информация о покупателе</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ваш OPT ID:</span>
                  <span className="font-medium">{profile?.opt_id || 'Не указан'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ваш Telegram:</span>
                  <span className="font-medium">{profile?.telegram || 'Не указан'}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm mb-1.5">Дополнительная информация</h3>
              <Textarea
                placeholder="Укажите дополнительную информацию по заказу (необязательно)"
                className="resize-none text-sm"
                rows={3}
                onChange={(e) => {
                  const textOrder = e.target.value;
                  if (typeof onConfirm === 'function') {
                    const originalOnConfirm = onConfirm;
                    onConfirm = () => {
                      const orderData = {
                        text_order: textOrder,
                        // ... other order data
                      };
                      originalOnConfirm(orderData);
                    };
                  }
                }}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="mt-3">
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 p-2 sm:p-3">
            <div className="flex items-start space-x-2">
              <InfoIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <AlertDescription className="text-yellow-900 text-xs sm:text-sm">
                Внимательно изучите фото и описание товара. Optapp не несет ответственности за сделки между пользователями. 
                Больше информации в разделе <a href="/faq" className="underline text-yellow-700 hover:text-yellow-800">FAQ</a>.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        <DialogFooter className="flex sm:justify-end justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 pt-0 px-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 text-xs sm:text-sm h-8 sm:h-9"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
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
