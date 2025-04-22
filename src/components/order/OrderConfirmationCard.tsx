import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetails } from './OrderDetails';
import { OrderImages } from './OrderImages';
import { OrderVideos } from './OrderVideos';
import { Database } from '@/integrations/supabase/types';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

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

interface OrderConfirmationCardProps {
  order: Order;
  images: string[];
  videos?: string[];
  onOrderUpdate?: (updatedOrder: any) => void;
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  order,
  images,
  videos = [],
  onOrderUpdate,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const generateTelegramShareUrl = () => {
    const text = encodeURIComponent(
      `🛍 Заказ № ${order.order_number}\n\n` +
      `📦 Товар: ${order.title}\n` +
      `🏷 Бренд: ${order.brand || 'Не указан'}\n` +
      `📝 Модель: ${order.model || 'Не указана'}\n` +
      `💰 Цена: ${order.price} $\n` +
      `📦 Количество мест: ${order.quantity}\n` +
      `🆔 OPT_ID заказа: ${order.seller?.opt_id || 'Не указан'}\n` +
      (order.seller_id === order.buyer_id ? `🔄 Самозаказ\n` : 
        `🆔 OPT_ID получателя: ${order.buyer_opt_id || 'Не указан'}\n`) +
      (order.description ? `📄 Описание:\n${order.description}\n\n` : '') +
      (images.length > 0 ? `📸 Фотографии заказа:\n${images.join('\n')}` : '')
    );
    return `https://t.me/?text=${text}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-4">
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <InfoIcon className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            Внимательно изучите фото и описание товара. Optapp не несет ответственности за сделки между пользователями. 
            Больше информации в разделе <a href="/faq" className="underline text-yellow-700 hover:text-yellow-800">FAQ</a>.
          </AlertDescription>
        </Alert>
      </div>

      <CardHeader className="text-center relative">
        <div className="absolute right-6 top-6 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-[#229ED9] hover:bg-[#229ED9]/90 text-white border-none"
            onClick={() => window.open(generateTelegramShareUrl(), '_blank')}
          >
            <Send className="h-4 w-4" />
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
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-6">
        <OrderDetails order={order} />

        {order.description && (
          <div>
            <Label className="text-sm text-gray-500 mb-2 block">Описание</Label>
            <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
          </div>
        )}

        <OrderImages images={images} />

        <OrderVideos videos={videos} />

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <InfoIcon className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div className="text-yellow-900">
              <p className="font-semibold mb-2">Внимание!</p>
              <p>
                Внимательно изучите фото и описание товара. Optapp не несет ответственности за сделки между пользователями. 
                Перед подтверждением заказа проверьте все детали. 
                Больше информации вы можете найти в разделе <a href="/faq" className="underline text-yellow-700 hover:text-yellow-800">FAQ</a>.
              </p>
            </div>
          </div>
        </div>
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
