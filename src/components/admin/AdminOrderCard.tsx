
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Link, CheckCircle, Truck } from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { OrderConfirmImagesDialog } from "@/components/order/OrderConfirmImagesDialog";

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface AdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export const AdminOrderCard: React.FC<AdminOrderCardProps> = ({ order, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  
  const highlightColor = 
    order.status === 'processed' ? 'bg-[#F2FCE2]' :
    order.status === 'created' || order.status === 'seller_confirmed' ? 'bg-[#FEF7CD]' :
    order.status === 'admin_confirmed' ? 'bg-[#FED7AA]' :
    '';

  const handleConfirm = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'admin_confirmed' })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заказ подтвержден администратором",
      });

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      
      // Получаем изображения заказа для отправки уведомления
      try {
        console.log('Отправка уведомления об изменении статуса заказа:', order.id);
        
        // Получаем изображения заказа
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', order.id);
          
        const images = orderImages?.map(img => img.url) || [];
        
        // Вызов edge-функции для отправки уведомления со статусом 'status_change'
        const notificationResult = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...order, status: 'admin_confirmed', images },
            action: 'status_change'
          }
        });
        
        console.log('Результат отправки уведомления об изменении статуса:', notificationResult);
      } catch (notifyError) {
        console.error('Ошибка отправки уведомления об изменении статуса заказа:', notifyError);
        // Продолжаем выполнение даже при ошибке отправки уведомления
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить заказ",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processed' })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заказ зарегистрирован",
      });

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      
      // Отправка уведомления об изменении статуса заказа
      try {
        console.log('Отправка уведомления о регистрации заказа:', order.id);
        
        // Получаем изображения заказа
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', order.id);
          
        const images = orderImages?.map(img => img.url) || [];
        
        // Вызов edge-функции для отправки уведомления
        const notificationResult = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...order, status: 'processed', images },
            action: 'status_change'
          }
        });
        
        console.log('Результат отправки уведомления о регистрации заказа:', notificationResult);
      } catch (notifyError) {
        console.error('Ошибка отправки уведомления о регистрации заказа:', notifyError);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось зарегистрировать заказ",
        variant: "destructive",
      });
    }
  };

  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';
  const showRegisterButton = order.status === 'admin_confirmed';

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return 'Самовывоз';
      case 'cargo_rf':
        return 'Доставка Cargo РФ';
      case 'cargo_kz':
        return 'Доставка Cargo KZ';
      default:
        return 'Не указан';
    }
  };

  return (
    <Card className={`h-full ${highlightColor} flex flex-col`}>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">№ {order.order_number}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="space-y-2">
          <div className="font-medium">{order.title}</div>
          <div className="text-sm text-muted-foreground">
            {order.brand} {order.model}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Продавец</div>
          <div className="space-y-1">
            <div>{order.seller?.full_name || 'Не указано'}</div>
            {order.seller?.opt_id && (
              <Badge variant="outline" className="font-mono">
                {order.seller.opt_id}
              </Badge>
            )}
            {order.seller?.telegram && (
              <a
                href={`https://t.me/${order.seller.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {order.seller.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Покупатель</div>
          <div className="space-y-1">
            <div>{order.buyer?.full_name || 'Не указано'}</div>
            {order.buyer?.opt_id && (
              <Badge variant="outline" className="font-mono">
                {order.buyer.opt_id}
              </Badge>
            )}
            {order.buyer?.telegram && (
              <a
                href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {order.buyer.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {order.text_order && order.text_order.trim() !== "" && (
          <div className="text-sm text-gray-600 mt-2 border-t pt-2">
            <span className="font-medium">Дополнительная информация:</span>
            <p className="mt-1 whitespace-pre-wrap line-clamp-3">{order.text_order}</p>
          </div>
        )}

        <div className="space-y-2 border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Стоимость товара:</span>
            <span className="text-lg">{order.price} $</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Способ доставки:</span>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>{getDeliveryMethodLabel(order.delivery_method)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Стоимость доставки:</span>
            <span className="text-lg text-primary">
              {order.delivery_price_confirm ? `${order.delivery_price_confirm} $` : 'Не указана'}
            </span>
          </div>

          {order.delivery_price_confirm && (
            <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
              <span>Итого:</span>
              <span>{Number(order.price) + Number(order.delivery_price_confirm)} $</span>
            </div>
          )}
        </div>

        <OrderConfirmImagesDialog orderId={order.id} />

        <div className="pt-2 space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">Мест для отправки:</span>
              <span>{order.place_number || 1}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <div className="p-4 border-t flex items-center justify-end gap-2">
        {showConfirmButton && (
          <Button
            variant="outline"
            size="icon"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleConfirm}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
        {showRegisterButton && (
          <Button
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleRegister}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Зарегистрировать
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(order)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(order)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
