import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, Eye, Camera } from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { CompactOrderInfo } from './CompactOrderInfo';
import { ResendNotificationButton } from './ResendNotificationButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';

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
    opt_status: string | null;
  } | null;
};

interface EnhancedAdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
}

export const EnhancedAdminOrderCard: React.FC<EnhancedAdminOrderCardProps> = ({ 
  order, 
  onEdit, 
  onDelete,
  onViewDetails 
}) => {
  const queryClient = useQueryClient();
  const [isConfirmImagesDialogOpen, setIsConfirmImagesDialogOpen] = useState(false);
  
  // Check if confirmation images exist for this order
  const { data: confirmImages = [] } = useQuery({
    queryKey: ['confirm-images', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', order.id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });
  
  const highlightColor = 
    order.status === 'processed' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
    order.status === 'created' || order.status === 'seller_confirmed' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' :
    order.status === 'admin_confirmed' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' :
    order.status === 'shipped' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' :
    order.status === 'delivered' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' :
    order.status === 'cancelled' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
    'bg-white';

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
      
      // Отправка уведомления
      try {
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', order.id);
          
        const images = orderImages?.map(img => img.url) || [];
        
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...order, status: 'admin_confirmed', images },
            action: 'status_change'
          }
        });
      } catch (notifyError) {
        console.error('Ошибка отправки уведомления:', notifyError);
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
      
      // Отправка уведомления
      try {
        const { data: orderImages } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', order.id);
          
        const images = orderImages?.map(img => img.url) || [];
        
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...order, status: 'processed', images },
            action: 'status_change'
          }
        });
      } catch (notifyError) {
        console.error('Ошибка отправки уведомления:', notifyError);
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

  return (
    <Card className={`${highlightColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col`}>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <OrderImageThumbnail 
              orderId={order.id} 
              size="thumbnail" 
              className="w-12 h-12 flex-shrink-0"
            />
            <div className="flex flex-col gap-1">
              <EnhancedOrderStatusBadge status={order.status} />
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ResendNotificationButton 
              orderId={order.id}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={() => onViewDetails(order.id)}
              title="Посмотреть детали заказа"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        <CompactOrderInfo order={order} />

        {order.text_order && order.text_order.trim() !== "" && (
          <div className="text-sm text-gray-600 border-t pt-3">
            <span className="font-medium">Дополнительная информация:</span>
            <p className="mt-1 whitespace-pre-wrap line-clamp-2">{order.text_order}</p>
          </div>
        )}

        <div className="border-t pt-3">
          {confirmImages.length > 0 ? (
            <div 
              className="flex items-center text-sm text-green-600 font-medium cursor-pointer"
              onClick={() => setIsConfirmImagesDialogOpen(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Фото-подтверждение есть ({confirmImages.length})</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsConfirmImagesDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Загрузить фото-подтверждение
            </Button>
          )}
        </div>
      </CardContent>
      
      <div className="p-4 border-t bg-white/50 backdrop-blur-sm flex items-center justify-end gap-2">
        {showConfirmButton && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
            onClick={handleConfirm}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Подтвердить
          </Button>
        )}
        {showRegisterButton && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
            onClick={handleRegister}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Зарегистрировать
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
          onClick={() => onEdit(order)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => onDelete(order)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isConfirmImagesDialogOpen} onOpenChange={(isOpen) => {
        setIsConfirmImagesDialogOpen(isOpen);
        if (!isOpen) {
          queryClient.invalidateQueries({ queryKey: ['confirm-images', order.id] });
        }
      }}>
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
    </Card>
  );
};
