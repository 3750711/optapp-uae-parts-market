
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building, Phone, MessageCircle, Mail, MapPin } from "lucide-react";

interface OrderEditHeaderProps {
  order: any;
}

export const OrderEditHeader: React.FC<OrderEditHeaderProps> = ({ order }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processed':
        return 'bg-purple-100 text-purple-800';
      case 'admin_confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'seller_confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'Создан';
      case 'seller_confirmed':
        return 'Подтвержден продавцом';
      case 'admin_confirmed':
        return 'Подтвержден администратором';
      case 'processed':
        return 'Зарегистрирован';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl">
            Редактирование заказа № {order?.order_number}
          </DialogTitle>
          <Badge className={getStatusColor(order?.status)}>
            {getStatusText(order?.status)}
          </Badge>
        </div>
      </DialogHeader>

      {/* Compact user information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seller Info */}
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Продавец</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span>{order?.seller?.full_name || 'Не указано'}</span>
              </div>
              {order?.seller?.opt_id && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {order.seller.opt_id}
                  </Badge>
                </div>
              )}
              {order?.seller?.telegram && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-gray-500" />
                  <a 
                    href={`https://t.me/${order.seller.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{order.seller.telegram.replace('@', '')}
                  </a>
                </div>
              )}
              {order?.seller?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <a href={`tel:${order.seller.phone}`} className="text-blue-600 hover:underline">
                    {order.seller.phone}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Buyer Info */}
        <Card className="border-green-100 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Покупатель</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-gray-500" />
                <span>{order?.buyer?.full_name || 'Не указано'}</span>
              </div>
              {order?.buyer?.opt_id && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {order.buyer.opt_id}
                  </Badge>
                </div>
              )}
              {order?.buyer?.telegram && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-gray-500" />
                  <a 
                    href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    @{order.buyer.telegram.replace('@', '')}
                  </a>
                </div>
              )}
              {order?.buyer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <a href={`mailto:${order.buyer.email}`} className="text-green-600 hover:underline">
                    {order.buyer.email}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order summary */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Товар:</span>
              <p className="font-medium truncate">{order?.title}</p>
            </div>
            <div>
              <span className="text-gray-500">Цена:</span>
              <p className="font-medium">${order?.price}</p>
            </div>
            <div>
              <span className="text-gray-500">Мест:</span>
              <p className="font-medium">{order?.place_number}</p>
            </div>
            <div>
              <span className="text-gray-500">Создан:</span>
              <p className="font-medium">
                {order?.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : 'Не указано'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
