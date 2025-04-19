
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Share, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';

interface OrderConfirmationCardProps {
  order: {
    id?: string;
    order_number: number;
    title: string;
    price: number;
    quantity: number;
    buyer_opt_id?: string | null;
    seller_opt_id?: string | null;
    brand: string;
    model: string;
    status?: string;
  };
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
      `OPT ID получателя: ${order.buyer_opt_id || 'Не указан'}\n` +
      `OPT ID отправителя: ${order.seller_opt_id || 'Не указан'}\n\n` +
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
          {order.status === 'pending' && (
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
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">OPT_ID отправителя</Label>
              <p className="text-lg font-medium">{order.seller_opt_id || 'Не указан'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">OPT_ID получателя</Label>
              <p className="text-lg font-medium">{order.buyer_opt_id || 'Не указан'}</p>
            </div>
          </div>
        </div>
        
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
