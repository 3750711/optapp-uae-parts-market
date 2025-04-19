import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share, Edit2, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';
import { Badge } from "@/components/ui/badge";
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer?: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface OrderConfirmationCardProps {
  order: Order;
  images: string[];
  onOrderUpdate?: (updatedOrder: any) => void;
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({ 
  order, 
  images,
  onOrderUpdate 
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const generateTelegramShareUrl = () => {
    const text = encodeURIComponent(
      `Заказ № ${order.order_number}\n` +
      `Наименование: ${order.title}\n` +
      `Бренд: ${order.brand}\n` +
      `Модель: ${order.model}\n` +
      `Цена: ${order.price} AED\n` +
      `Количество мест: ${order.quantity}\n` +
      `OPT ID отправителя: ${order.seller_opt_id || 'Не указан'}\n` +
      `OPT ID получателя: ${order.buyer_opt_id || 'Не указан'}\n\n` +
      `Фотографии заказа:\n${images.join('\n')}`
    );
    return `https://t.me/share/url?url=&text=${text}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'admin_confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'processed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return 'Создан';
      case 'seller_confirmed':
        return 'Подтвержден продавцом';
      case 'admin_confirmed':
        return 'Подтвержден администратором';
      case 'processed':
        return 'В обработке';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      default:
        return status;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center relative">
        <div className="absolute right-6 top-6 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.open(generateTelegramShareUrl(), '_blank')}
          >
            <Share className="h-4 w-4" />
          </Button>
          {order.status === 'created' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardTitle className="text-6xl font-bold text-optapp-dark">
          № {order.order_number}
        </CardTitle>
        <Badge className={getStatusBadgeColor(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
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
              <p className="text-lg font-medium">{order.price} AED</p>
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
              <Label className="text-sm text-gray-500">OPT ID отправителя</Label>
              <p className="text-lg font-medium">{order.seller_opt_id || 'Не указан'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">OPT ID получателя</Label>
              <p className="text-lg font-medium">{order.buyer_opt_id || 'Не указан'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Имя отправителя</Label>
              <p className="text-lg font-medium">{order.order_seller_name}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Информация о получателе</Label>
              {order.telegram_url_order ? (
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
              ) : (
                <p className="text-gray-500">Контакты не указаны</p>
              )}
            </div>
          </div>
        </div>
        
        {order.description && (
          <div>
            <Label className="text-sm text-gray-500 mb-2 block">Описание</Label>
            <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
          </div>
        )}
        
        {images.length > 0 && (
          <div>
            <Label className="text-sm text-gray-500 mb-2 block">Фотографии заказа</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={url} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Order image ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Редактировать заказ № {order.order_number}</DialogTitle>
          </DialogHeader>
          <OrderEditForm 
            order={order}
            onSave={(updatedOrder) => {
              if (onOrderUpdate) {
                onOrderUpdate(updatedOrder);
              }
              setIsEditDialogOpen(false);
            }}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
