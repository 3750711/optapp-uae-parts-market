
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Edit2, Upload, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetails } from './OrderDetails';
import { OrderVideos } from './OrderVideos';
import { OrderConfirmationImages } from './OrderConfirmationImages';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  onOrderUpdate
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmImagesDialogOpen, setIsConfirmImagesDialogOpen] = useState(false);
  const { user, profile } = useAuth();

  // Проверяем, является ли пользователь администратором
  const isAdmin = profile?.user_type === 'admin';

  // Загружаем подтверждающие фотографии для администраторов
  const { data: confirmImages = [] } = useQuery({
    queryKey: ['confirm-images', order.id],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', order.id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: isAdmin
  });

  const generateTelegramShareUrl = () => {
    const text = encodeURIComponent(`🛍 Заказ № ${order.order_number}\n\n` + `📦 Товар: ${order.title}\n` + `🏷 Бренд: ${order.brand || 'Не указан'}\n` + `📝 Модель: ${order.model || 'Не указана'}\n` + `💰 Цена: ${order.price} $\n` + `📦 Количество мест: ${order.place_number}\n` + `🆔 OPT_ID заказа: ${order.seller?.opt_id || 'Не указан'}\n` + (order.seller_id === order.buyer_id ? `🔄 Самозаказ\n` : `🆔 OPT_ID получателя: ${order.buyer_opt_id || 'Не указан'}\n`) + (order.description ? `📄 Описание:\n${order.description}\n\n` : '') + (images.length > 0 ? `📸 Фотографии заказа:\n${images.join('\n')}` : ''));
    return `https://t.me/?text=${text}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center relative">
        <div className="absolute right-6 top-6 flex gap-2">
          {/* Компактная кнопка загрузки подтверждающих фото для администраторов */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmImagesDialogOpen(true)}
              className="h-8 px-2 text-xs relative"
              title="Подтверждающие фото"
            >
              <Camera className="h-3 w-3" />
              {confirmImages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {confirmImages.length}
                </span>
              )}
            </Button>
          )}
          {order.status === 'created'}
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

        {/* Отображение миниатюр подтверждающих фото только если они есть */}
        {isAdmin && confirmImages.length > 0 && (
          <div>
            <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Подтверждающие фотографии ({confirmImages.length})
            </Label>
            <div className="flex gap-2 flex-wrap">
              {confirmImages.slice(0, 3).map((url, index) => (
                <div 
                  key={index} 
                  className="w-16 h-16 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsConfirmImagesDialogOpen(true)}
                >
                  <img 
                    src={url} 
                    alt={`Подтверждающее фото ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {confirmImages.length > 3 && (
                <div 
                  className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setIsConfirmImagesDialogOpen(true)}
                >
                  +{confirmImages.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <OrderVideos videos={videos} />

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Редактировать заказ № {order.order_number}</DialogTitle>
            </DialogHeader>
            <OrderEditForm 
              order={order} 
              onSave={updatedOrder => {
                if (onOrderUpdate) {
                  onOrderUpdate(updatedOrder);
                }
                setIsEditDialogOpen(false);
              }} 
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>

        {/* Диалог для управления подтверждающими фотографиями */}
        {isAdmin && (
          <Dialog open={isConfirmImagesDialogOpen} onOpenChange={setIsConfirmImagesDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Подтверждающие фотографии - Заказ № {order.order_number}</DialogTitle>
              </DialogHeader>
              <OrderConfirmationImages 
                orderId={order.id} 
                canEdit={true}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
