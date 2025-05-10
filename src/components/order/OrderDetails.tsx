
import React from 'react';
import { Label } from "@/components/ui/label";
import { Link } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer?: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller?: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const { user } = useAuth();
  const isSelfOrder = order.seller_id === order.buyer_id;
  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  const isAuthorized = !!user && (isBuyer || isSeller || user.id === order.buyer_id || user.id === order.seller_id);

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return 'Самовывоз';
      case 'cargo_rf':
        return 'Доставка Cargo РФ';
      case 'cargo_kz':
        return 'Доставка Cargo KZ';
      default:
        return method;
    }
  };

  const handleDeliveryMethodChange = async (newMethod: Database['public']['Enums']['delivery_method']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_method: newMethod })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Успешно обновлено",
        description: "Способ доставки успешно изменен",
      });
    } catch (error) {
      console.error('Error updating delivery method:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить способ доставки",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-500">Наименование</Label>
          <p className="text-lg font-medium">{order.title}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Бренд</Label>
          <p className="text-lg font-medium">{order.brand}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Модель</Label>
          <p className="text-lg font-medium">{order.model}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Цена</Label>
          <p className="text-lg font-medium">{order.price} $</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Количество мест</Label>
          <p className="text-lg font-medium">{order.quantity}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Тип заказа</Label>
          <p className="text-lg font-medium">
            {order.order_created_type === 'free_order' ? 'Свободный заказ' : 'Заказ по объявлению'}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-500">OPT ID покупателя</Label>
          {isAuthorized ? (
            <p className="text-lg font-medium">{order.buyer_opt_id || 'Не указан'}</p>
          ) : (
            <p className="text-lg font-medium text-gray-400">Требуется авторизация</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-gray-500">OPT ID отправителя</Label>
          {isAuthorized ? (
            <p className="text-lg font-medium">{order.seller?.opt_id || 'Не указан'}</p>
          ) : (
            <p className="text-lg font-medium text-gray-400">Требуется авторизация</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-gray-500">Имя отправителя</Label>
          <p className="text-lg font-medium">{order.order_seller_name}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Информация о получателе</Label>
          {isAuthorized && order.telegram_url_order ? (
            <div className="space-y-2">
              <a 
                href={`https://t.me/${order.telegram_url_order.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                @{order.telegram_url_order}
                <Link className="h-4 w-4" />
              </a>
            </div>
          ) : order.telegram_url_order ? (
            <p className="text-gray-500">Требуется авторизация для просмотра контактов</p>
          ) : (
            <p className="text-gray-500">Контакты не указаны</p>
          )}
        </div>
        {isSelfOrder && (
          <div>
            <Label className="text-sm text-gray-500">Тип</Label>
            <p className="text-lg font-medium text-amber-600">Самозаказ</p>
          </div>
        )}
        <div>
          <Label className="text-sm text-gray-500">Способ доставки</Label>
          {isBuyer ? (
            <Select value={order.delivery_method} onValueChange={handleDeliveryMethodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите способ доставки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self_pickup">Самовывоз</SelectItem>
                <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-lg font-medium">
              {getDeliveryMethodLabel(order.delivery_method)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
