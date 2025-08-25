import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, InfoIcon, Package, Truck, User, DollarSign, ShoppingCart, CheckCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useIsMobile } from "@/hooks/use-mobile";

type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

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
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
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
  const [contactConsent, setContactConsent] = useState(false);
  const [textOrder, setTextOrder] = useState<string>("");
  const isMobile = useIsMobile();

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

  // Устанавливаем значение по умолчанию при первом рендере
  useEffect(() => {
    console.log("OrderConfirmationDialog - Current delivery method:", deliveryMethod);
    if (!deliveryMethod) {
      console.log("Setting default delivery method to cargo_rf");
      onDeliveryMethodChange('cargo_rf');
    }
  }, [deliveryMethod, onDeliveryMethodChange]);

  // Мемоизируем вычисляемые значения для оптимизации производительности
  const showDeliveryPrice = useMemo(() => 
    Boolean(product.delivery_price && product.delivery_price > 0),
    [product.delivery_price]
  );

  const totalPrice = useMemo(() => {
    const basePrice = product.price;
    const deliveryPrice = showDeliveryPrice && product.delivery_price ? product.delivery_price : 0;
    return basePrice + deliveryPrice;
  }, [product.price, product.delivery_price, showDeliveryPrice]);

  const isFormValid = useMemo(() => {
    if (deliveryMethod === 'self_pickup') {
      return contactConsent;
    }
    return true;
  }, [deliveryMethod, contactConsent]);

  const isFormDisabled = isSubmitting || !canSubmit;

  const handleConfirm = () => {
    if (!isFormValid) {
      toast({
        title: "Требуется согласие",
        description: "Для самовывоза необходимо дать согласие на передачу контактных данных",
        variant: "destructive",
      });
      return;
    }
    console.log("Submitting text_order:", textOrder);
    guardedSubmit(async () => {
      onConfirm({ text_order: textOrder });
    });
  };

  const getDeliveryMethodLabel = (method: DeliveryMethod) => {
    switch (method) {
      case 'cargo_rf':
        return 'Доставка Cargo РФ';
      case 'cargo_kz':
        return 'Доставка Cargo KZ';
      case 'self_pickup':
        return 'Самовывоз';
      default:
        return method;
    }
  };

  // Компонент содержимого для переиспользования
  const OrderContent = () => (
    <div className="space-y-3">
      {/* Компактная информация о товаре - для мобильных */}
      {isMobile ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-blue-900 text-sm">Товар</h3>
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-medium text-gray-900 line-clamp-2">{product.title}</div>
            <div className="flex justify-between">
              <span className="text-gray-600">{product.brand} {product.model}</span>
              <span className="font-medium text-green-700">{product.price} $</span>
            </div>
            {product.lot_number !== undefined && product.lot_number !== null && (
              <div className="text-gray-600">Лот: {product.lot_number}</div>
            )}
          </div>
        </div>
      ) : (
        /* Полная информация о товаре для десктопа */
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
      )}

      {/* Способ доставки */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="h-4 w-4 text-green-600" />
          <h3 className={`font-medium text-green-900 ${isMobile ? 'text-sm' : 'font-semibold'}`}>Способ доставки</h3>
        </div>
        
        <Select 
          value={deliveryMethod || 'cargo_rf'}
          onValueChange={(value) => {
            console.log("Changing delivery method to:", value);
            onDeliveryMethodChange(value as DeliveryMethod);
          }}
          disabled={isFormDisabled}
        >
          <SelectTrigger className={`w-full bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-optapp-yellow ${isMobile ? 'h-9 text-sm' : 'h-10'}`}>
            <SelectValue placeholder="Выберите способ доставки" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
            <SelectItem value="cargo_rf" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
              🚛 Доставка Cargo РФ
            </SelectItem>
            <SelectItem value="cargo_kz" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
              🚚 Доставка Cargo KZ
            </SelectItem>
            <SelectItem value="self_pickup" className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
              📦 Самовывоз
            </SelectItem>
          </SelectContent>
        </Select>
        
        {showDeliveryPrice && product.delivery_price !== undefined && (
          <div className="mt-2 p-2 bg-white rounded-md border border-green-300">
            <div className="flex justify-between items-center">
              <span className={`text-green-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Стоимость доставки:</span>
              <span className={`font-bold text-green-800 ${isMobile ? 'text-sm' : ''}`}>{product.delivery_price} $</span>
            </div>
          </div>
        )}

        {deliveryMethod === 'self_pickup' && (
          <div className="flex items-start space-x-2 mt-2 p-2 bg-white rounded-md border border-green-300">
            <Checkbox 
              id="contactConsent"
              checked={contactConsent}
              onCheckedChange={(checked) => setContactConsent(checked as boolean)}
              className="border-green-400 mt-1"
              disabled={isFormDisabled}
            />
            <label
              htmlFor="contactConsent"
              className={`text-green-800 leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              Даю согласие поделиться моими контактными данными с продавцом для организации самовывоза
            </label>
          </div>
        )}
      </div>

      {/* Компактная информация об участниках для мобильных */}
      {isMobile ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <User className="h-3 w-3 text-purple-600" />
              <h3 className="font-medium text-purple-900 text-xs">Продавец</h3>
            </div>
            <div className="text-xs text-gray-700 truncate">{product.seller_name || 'Не указан'}</div>
            <div className="text-xs text-gray-600 truncate">{product.optid_created || 'Не указан'}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <ShoppingCart className="h-3 w-3 text-indigo-600" />
              <h3 className="font-medium text-indigo-900 text-xs">Покупатель</h3>
            </div>
            <div className="text-xs text-gray-700 truncate">{profile?.opt_id || 'Не указан'}</div>
            <div className="text-xs text-gray-600 truncate">{profile?.telegram || 'Не указан'}</div>
          </div>
        </div>
      ) : (
        /* Полная информация об участниках для десктопа */
        <>
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
        </>
      )}

      {/* Дополнительная информация */}
      <div className="space-y-2">
        <h3 className={`font-medium flex items-center gap-2 ${isMobile ? 'text-sm' : 'font-semibold'}`}>
          <InfoIcon className="h-4 w-4 text-gray-600" />
          Дополнительная информация
        </h3>
        <Textarea
          placeholder="Укажите дополнительную информацию по заказу (необязательно)"
          className={`resize-none ${isMobile ? 'text-xs min-h-[60px]' : 'text-sm min-h-[80px]'}`}
          rows={isMobile ? 2 : 3}
          value={textOrder}
          onChange={(e) => setTextOrder(e.target.value)}
          disabled={isFormDisabled}
        />
      </div>

      {/* Предупреждение */}
      <Alert variant="default" className="bg-yellow-50 border-yellow-200 p-2">
        <div className="flex items-start space-x-2">
          <InfoIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className={`text-yellow-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Внимательно изучите фото и описание товара. Partsbay.ae не несет ответственности за сделки между пользователями.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isFormDisabled}
        className={`${isMobile ? 'flex-1 text-sm h-10' : 'text-sm h-11 px-6 sm:h-10'}`}
      >
        Отмена
      </Button>
      <Button
        onClick={handleConfirm}
        className={`bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 disabled:opacity-50 ${isMobile ? 'flex-1 text-sm h-10' : 'text-sm h-11 px-6 sm:h-10'}`}
        disabled={isFormDisabled || !isFormValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isMobile ? 'Обработка...' : 'Обработка...'}
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {isMobile ? 'Подтвердить' : 'Подтвердить заказ'}
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex flex-col h-[90vh] max-h-[90vh]">
          {/* Фиксированный header с общей суммой */}
          <SheetHeader className="pb-4 flex-shrink-0 border-b">
            <div>
              <SheetTitle className="text-lg">Подтверждение заказа</SheetTitle>
              <SheetDescription className="text-sm">
                Проверьте информацию перед подтверждением
              </SheetDescription>
            </div>
            
            {/* Общая сумма - компактно */}
            <div className="bg-gradient-to-r from-optapp-yellow/10 to-yellow-50 border-2 border-optapp-yellow/30 rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-optapp-yellow" />
                  <span className="font-medium text-gray-700 text-sm">Итого:</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{totalPrice} $</div>
                  {showDeliveryPrice && product.delivery_price && (
                    <div className="text-xs text-gray-600">
                      включая доставку {product.delivery_price} $
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>
          
          {/* Прокручиваемый контент */}
          <ScrollArea className="flex-1 px-1">
            <div className="pb-4">
              <OrderContent />
            </div>
          </ScrollArea>
          
          {/* Липкий footer с кнопками */}
          <div className="border-t bg-white p-4 flex gap-3 flex-shrink-0">
            <ActionButtons />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Подтверждение заказа</DialogTitle>
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
          <OrderContent />
        </ScrollArea>

        {/* Кнопки */}
        <DialogFooter className="flex sm:justify-end justify-between gap-3 mt-4 pt-0 px-0 flex-shrink-0">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
