
import React, { useState } from "react";
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
import { Database } from "@/integrations/supabase/types";

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orderData: { text_order?: string }) => void;
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
    delivery_price?: number;
  };
  profile?: {
    opt_id?: string;
    telegram?: string;
    opt_status?: string;
  } | null;
  deliveryMethod: Database["public"]["Enums"]["delivery_method"];
  onDeliveryMethodChange: (method: Database["public"]["Enums"]["delivery_method"]) => void;
}

const OrderConfirmationDialog: React.FC<OrderConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  product,
  profile,
  deliveryMethod,
}) => {
  const [textOrder, setTextOrder] = useState<string>("");

  const handleConfirm = () => {
    console.log("Submitting text_order:", textOrder);
    onConfirm({ text_order: textOrder });
  };

  // Updated condition to show delivery price when opt_status is 'opt_user' (was 'opt_used')
  const showDeliveryPrice = profile?.opt_status === 'opt_user' && deliveryMethod === 'cargo_rf';

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
              <h3 className="font-semibold text-sm mb-1.5">Способ доставки</h3>
              
              {showDeliveryPrice && product.delivery_price !== undefined && (
                <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Стоимость доставки:</span>
                    <span className="font-medium text-gray-900">{product.delivery_price} $</span>
                  </div>
                </div>
              )}
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
                value={textOrder}
                onChange={(e) => setTextOrder(e.target.value)}
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
            onClick={handleConfirm}
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
