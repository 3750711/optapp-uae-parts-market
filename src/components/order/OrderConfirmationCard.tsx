
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Edit2, Upload, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderEditForm } from './OrderEditForm';
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderDetails } from './OrderDetails';
import { OrderConfirmationImages } from './OrderConfirmationImages';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
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
  const { user } = useAuth();
  const { profile } = useProfile();

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
          {order.status === 'created' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 px-2 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Редактировать
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

        {/* Share button */}
        <div className="flex justify-center pt-4">
          <Button 
            onClick={() => window.open(generateTelegramShareUrl(), '_blank')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Поделиться в Telegram
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
