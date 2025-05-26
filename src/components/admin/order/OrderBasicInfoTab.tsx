
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderBasicInfoTabProps {
  form: any;
  order: any;
}

export const OrderBasicInfoTab: React.FC<OrderBasicInfoTabProps> = ({ form, order }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [isCheckingOrderNumber, setIsCheckingOrderNumber] = React.useState(false);

  // Watch for form changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Check order number uniqueness
  const checkOrderNumberUnique = React.useCallback(async (orderNumber: number) => {
    if (!orderNumber || orderNumber <= 0) return;
    
    setIsCheckingOrderNumber(true);
    try {
      const { data, error } = await supabase.rpc('check_order_number_unique', {
        p_order_number: orderNumber,
        p_order_id: order?.id
      });

      if (error) throw error;

      if (!data) {
        setValidationErrors(prev => ({ 
          ...prev, 
          order_number: 'Номер заказа уже существует' 
        }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.order_number;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking order number:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить уникальность номера заказа",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOrderNumber(false);
    }
  }, [order?.id]);

  // Real-time validation
  const validateField = (name: string, value: any) => {
    const errors: Record<string, string> = {};
    
    switch (name) {
      case 'order_number':
        if (!value || Number(value) <= 0) {
          errors.order_number = 'Номер заказа должен быть больше 0';
        } else {
          // Check uniqueness asynchronously
          checkOrderNumberUnique(Number(value));
        }
        break;
      case 'price':
        if (!value || Number(value) <= 0) {
          errors.price = 'Цена должна быть больше 0';
        }
        break;
      case 'place_number':
        if (!value || Number(value) <= 0) {
          errors.place_number = 'Количество мест должно быть больше 0';
        }
        break;
      case 'title':
        if (!value || value.trim().length < 3) {
          errors.title = 'Наименование должно содержать минимум 3 символа';
        }
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, [name]: errors[name] }));
  };

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">У вас есть несохраненные изменения</span>
        </div>
      )}

      {/* Order Status and Priority Indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant={order?.status === 'delivered' ? 'default' : 'secondary'}>
            {order?.status === 'created' && 'Создан'}
            {order?.status === 'seller_confirmed' && 'Подтвержден продавцом'}
            {order?.status === 'admin_confirmed' && 'Подтвержден администратором'}
            {order?.status === 'processed' && 'Зарегистрирован'}
            {order?.status === 'shipped' && 'Отправлен'}
            {order?.status === 'delivered' && 'Доставлен'}
            {order?.status === 'cancelled' && 'Отменен'}
          </Badge>
          <span className="text-sm text-gray-600">Заказ № {order?.order_number}</span>
        </div>
        {Object.keys(validationErrors).length === 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Все поля заполнены корректно</span>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="order_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер заказа *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    {...field} 
                    type="number"
                    min="1"
                    onBlur={() => validateField('order_number', field.value)}
                    className={validationErrors.order_number ? 'border-red-500' : ''}
                    disabled={isCheckingOrderNumber}
                  />
                  {isCheckingOrderNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </FormControl>
              {validationErrors.order_number && (
                <p className="text-sm text-red-600">{validationErrors.order_number}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Наименование *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onBlur={() => validateField('title', field.value)}
                  className={validationErrors.title ? 'border-red-500' : ''}
                />
              </FormControl>
              {validationErrors.title && (
                <p className="text-sm text-red-600">{validationErrors.title}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Бренд</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Модель</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена ($) *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  step="0.01"
                  onBlur={() => validateField('price', field.value)}
                  className={validationErrors.price ? 'border-red-500' : ''}
                />
              </FormControl>
              {validationErrors.price && (
                <p className="text-sm text-red-600">{validationErrors.price}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="place_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Количество мест *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1"
                  onBlur={() => validateField('place_number', field.value)}
                  className={validationErrors.place_number ? 'border-red-500' : ''}
                />
              </FormControl>
              {validationErrors.place_number && (
                <p className="text-sm text-red-600">{validationErrors.place_number}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="delivery_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Способ доставки</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ доставки" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="self_pickup">Самовывоз</SelectItem>
                  <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                  <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="delivery_price_confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтвержденная стоимость доставки ($)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Статус</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border border-gray-200 shadow-md">
                  <SelectItem value="created">Создан</SelectItem>
                  <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                  <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                  <SelectItem value="processed">Зарегистрирован</SelectItem>
                  <SelectItem value="shipped">Отправлен</SelectItem>
                  <SelectItem value="delivered">Доставлен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Описание</FormLabel>
            <FormControl>
              <Textarea {...field} rows={4} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
