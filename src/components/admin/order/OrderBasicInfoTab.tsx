
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, User, Building, Phone, MessageCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderBasicInfoTabProps {
  form: any;
  order: any;
}

export const OrderBasicInfoTab: React.FC<OrderBasicInfoTabProps> = ({ form, order }) => {
  const isMobile = useIsMobile();
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
          checkOrderNumberUnique(Number(value));
        }
        break;
      case 'price':
        if (!value || isNaN(Number(value))) {
          errors.price = 'Цена должна быть числом';
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
    <div className="space-y-4 md:space-y-6">
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-700">У вас есть несохраненные изменения</span>
        </div>
      )}

      {Object.keys(validationErrors).length === 0 && (
        <div className="flex items-center gap-2 p-3 md:p-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700">Все поля заполнены корректно</span>
        </div>
      )}

      {/* Participants Information - for reference only */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {/* Seller Info */}
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
              <Building className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-blue-600`} />
              Продавец
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'pt-0 pb-3' : 'pt-0'}`}>
            <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center gap-2">
                <User className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} text-gray-500`} />
                <span className="truncate">{order?.seller?.full_name || 'Не указано'}</span>
              </div>
              {order?.seller?.opt_id && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${isMobile ? 'text-[10px] px-1 py-0' : 'text-xs'}`}>
                    {order.seller.opt_id}
                  </Badge>
                </div>
              )}
              {order?.seller?.telegram && (
                <div className="flex items-center gap-2">
                  <MessageCircle className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} text-gray-500`} />
                  <span className="text-blue-600 truncate">@{order.seller.telegram.replace('@', '')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Buyer Info */}
        <Card className="border-green-100 bg-green-50">
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
              <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
              Покупатель
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'pt-0 pb-3' : 'pt-0'}`}>
            <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center gap-2">
                <User className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} text-gray-500`} />
                <span className="truncate">{order?.buyer?.full_name || 'Не указано'}</span>
              </div>
              {order?.buyer?.opt_id && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${isMobile ? 'text-[10px] px-1 py-0' : 'text-xs'}`}>
                    {order.buyer.opt_id}
                  </Badge>
                </div>
              )}
              {order?.buyer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} text-gray-500`} />
                  <span className="text-green-600 truncate">{order.buyer.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable Order Information */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Информация для редактирования</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="order_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm md:text-base">Номер заказа *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        onBlur={() => validateField('order_number', field.value)}
                        className={`h-12 md:h-10 ${validationErrors.order_number ? 'border-red-500' : ''}`}
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
                  <FormLabel className="text-sm md:text-base">Наименование *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      onBlur={() => validateField('title', field.value)}
                      className={`h-12 md:h-10 ${validationErrors.title ? 'border-red-500' : ''}`}
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
                  <FormLabel className="text-sm md:text-base">Бренд</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 md:h-10" />
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
                  <FormLabel className="text-sm md:text-base">Модель</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 md:h-10" />
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
                  <FormLabel className="text-sm md:text-base">Цена ($) *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01"
                      onBlur={() => validateField('price', field.value)}
                      className={`h-12 md:h-10 ${validationErrors.price ? 'border-red-500' : ''}`}
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
                  <FormLabel className="text-sm md:text-base">Количество мест *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1"
                      onBlur={() => validateField('place_number', field.value)}
                      className={`h-12 md:h-10 ${validationErrors.place_number ? 'border-red-500' : ''}`}
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
                  <FormLabel className="text-sm md:text-base">Способ доставки</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 md:h-10">
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
                  <FormLabel className="text-sm md:text-base">Подтвержденная стоимость доставки ($)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" className="h-12 md:h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm md:text-base">Статус</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 md:h-10">
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
                <FormLabel className="text-sm md:text-base">Описание</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={isMobile ? 3 : 4} 
                    className="min-h-[100px] md:min-h-[120px] resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
