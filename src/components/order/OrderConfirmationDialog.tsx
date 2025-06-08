import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, InfoIcon, Package, Truck, User, DollarSign, ShoppingCart, CheckCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { toast } from "@/hooks/use-toast";

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
  onDeliveryMethodChange,
}) => {
  const [textOrder, setTextOrder] = useState<string>("");
  
  // Добавляем защиту от дублирующих отправок
  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      toast({
        title: "Подождите",
        description: "Заказ уже создается, пожалуйста подождите",
        variant: "destructive",
      });
    }
  });
  
  // Set default value to cargo_rf on first render if not set
  useEffect(() => {
    console.log("OrderConfirmationDialog (order) - Current delivery method:", deliveryMethod);
    if (!deliveryMethod) {
      console.log("Setting default delivery method to cargo_rf");
      onDeliveryMethodChange('cargo_rf');
    }
  }, [deliveryMethod, onDeliveryMethodChange]);

  const handleConfirm = () => {
    console.log("Submitting text_order:", textOrder);
    guardedSubmit(async () => {
      onConfirm({ text_order: textOrder });
    });
  };

  // Добавляем явную проверку на случай, если profile равен null
  const optStatus = profile?.opt_status || 'free_user';
  
  // Обновленное условие с учетом возможности null
  const showDeliveryPrice = optStatus === 'opt_user' && deliveryMethod === 'cargo_rf';

  const totalPrice = product.price + (showDeliveryPrice && product.delivery_price ? product.delivery_price : 0);

  const isFormDisabled = isSubmitting || !canSubmit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Подтверждение заказа
          </DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте информацию перед подтверждением
          </DialogDescription>
        </DialogHeader>

        {/* Общая сумма - выделенная секция */}
        <div className="bg-gradient-to-r from-optapp-yellow/10 to-yellow-50 border-2 border-optapp-yellow/30 rounded-lg p-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-optapp-yellow" />
              <span className="font-semibold text-gray-700">Итого к оплате:</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalPrice} $</div>
              {showDeliveryPrice && product.delivery_price && (
                <div className="text-sm text-gray-600">
                  включая доставку {product.delivery_price} $
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4 text-sm">
            {/* Информация о товаре */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Информация о товаре</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Наименование:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{product.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Бренд:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Модель:</span>
                  <span className="font-medium">{product.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Цена:</span>
                  <span className="font-medium text-green-700">{product.price} $</span>
                </div>
                {product.lot_number !== undefined && product.lot_number !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Номер лота:</span>
                    <span className="font-medium">{product.lot_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Способ доставки */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Способ доставки</h3>
              </div>
              
              <Select 
                value={deliveryMethod || 'cargo_rf'}
                onValueChange={(value) => {
                  console.log("Changing delivery method to:", value);
                  onDeliveryMethodChange(value as Database["public"]["Enums"]["delivery_method"]);
                }}
                disabled={isFormDisabled}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-optapp-yellow h-10">
                  <SelectValue placeholder="Выберите способ доставки" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                  <SelectItem 
                    value="cargo_rf" 
                    className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                  >
                    🚛 Доставка Cargo РФ
                  </SelectItem>
                  <SelectItem 
                    value="cargo_kz" 
                    className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                  >
                    🚚 Доставка Cargo KZ
                  </SelectItem>
                  <SelectItem 
                    value="self_pickup" 
                    className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                  >
                    📦 Самовывоз
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {showDeliveryPrice && product.delivery_price !== undefined && (
                <div className="mt-3 p-3 bg-white rounded-md border border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Стоимость доставки:</span>
                    <span className="font-bold text-green-800">{product.delivery_price} $</span>
                  </div>
                </div>
              )}
            </div>

            {/* Информация о продавце */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Информация о продавце</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Продавец:</span>
                  <span className="font-medium">{product.seller_name || 'Не указан'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">OPT ID:</span>
                  <span className="font-medium">{product.optid_created || 'Не указан'}</span>
                </div>
              </div>
            </div>

            {/* Информация о покупателе */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Информация о покупателе</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ваш OPT ID:</span>
                  <span className="font-medium">{profile?.opt_id || 'Не указан'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ваш Telegram:</span>
                  <span className="font-medium">{profile?.telegram || 'Не указан'}</span>
                </div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-gray-600" />
                Дополнительная информация
              </h3>
              <Textarea
                placeholder="Укажите дополнительную информацию по заказу (необязательно)"
                className="resize-none text-sm min-h-[80px]"
                rows={3}
                value={textOrder}
                onChange={(e) => setTextOrder(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Предупреждение */}
        <div className="mt-3 flex-shrink-0">
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 p-3">
            <div className="flex items-start space-x-2">
              <InfoIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <AlertDescription className="text-yellow-900 text-sm">
                Внимательно изучите фото и описание товара. Optapp не несет ответственности за сделки между пользователями. 
                Больше информации в разделе <a href="/faq" className="underline text-yellow-700 hover:text-yellow-800">FAQ</a>.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Кнопки */}
        <DialogFooter className="flex sm:justify-end justify-between gap-3 mt-4 pt-0 px-0 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isFormDisabled}
            className="text-sm h-11 px-6 sm:h-10"
          >
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 text-sm h-11 px-6 sm:h-10"
            disabled={isFormDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Подтвердить заказ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
