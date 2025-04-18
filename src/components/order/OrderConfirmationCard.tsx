
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface OrderConfirmationCardProps {
  order: {
    lot_number: number;
    title: string;
    price: number;
    quantity: number;
    buyer_opt_id?: string;
    seller_opt_id?: string;
    seller_name_order: string;
    brand: string;
    model: string;
  };
  images: string[];
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({ order, images }) => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-6xl font-bold text-optapp-dark">
          № {order.lot_number}
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
            <div>
              <Label className="text-sm text-gray-500">Продавец</Label>
              <p className="text-lg font-medium">{order.seller_name_order}</p>
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
    </Card>
  );
};
