
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetails } from './OrderDetails';
import { OrderImages } from './OrderImages';
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
