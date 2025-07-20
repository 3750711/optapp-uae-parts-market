
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, CheckCircle, Eye, MoreVertical, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { ResendNotificationButton } from './ResendNotificationButton';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrderConfirmationImages } from '@/components/order/OrderConfirmationImages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';

interface MobileOrderCardProps {
  order: Order;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
}

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction
}) => {
  const [isConfirmImagesDialogOpen, setIsConfirmImagesDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: confirmImages = [] } = useQuery({
    queryKey: ['confirm-images', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('id')
        .eq('order_id', order.id);

      if (error) {
        console.error('Error fetching confirm images:', error);
        return [];
      };
      return data || [];
    },
  });

  const totalValue = Number(order.price || 0) + Number(order.delivery_price_confirm || 0);
  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-200 
        ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : 'hover:shadow-md'}
      `}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header Block - Компактный заголовок */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(order.id)}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  №{order.order_number}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <ResendNotificationButton 
              orderId={order.id}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
              size="icon"
              className="h-7 w-7 p-0"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(order)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                {showConfirmButton && onQuickAction && (
                  <DropdownMenuItem onClick={() => onQuickAction(order.id, 'confirm')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Подтвердить
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(order)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Block - Отдельный блок для статуса */}
        <div className="flex items-center justify-between">
          <EnhancedOrderStatusBadge status={order.status} size="sm" />
        </div>

        {/* Product Info Block */}
        <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
          <OrderImageThumbnail orderId={order.id} className="h-12 w-12" size="thumbnail" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm line-clamp-2 mb-1">
              {order.title || 'Без названия'}
            </div>
            
            {(order.brand || order.model) && (
              <div className="text-xs text-muted-foreground">
                {[order.brand, order.model].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
        </div>

        {/* Users Block */}
        <div className="grid grid-cols-2 gap-2 bg-blue-50 rounded-lg p-2 text-xs">
          <div>
            <div className="text-muted-foreground mb-1 font-medium">Продавец</div>
            <div className="font-medium truncate">
              {order.seller?.full_name || 'Не указан'}
            </div>
            {order.seller?.opt_id && (
              <div className="text-muted-foreground font-mono text-xs">
                {order.seller.opt_id}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-muted-foreground mb-1 font-medium">Покупатель</div>
            <div className="font-medium truncate">
              {order.buyer?.full_name || 'Не указан'}
            </div>
            {order.buyer?.opt_id && (
              <div className="text-muted-foreground font-mono text-xs">
                {order.buyer.opt_id}
              </div>
            )}
          </div>
        </div>

        {/* Price Block */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-2">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Цена</div>
              <div className="font-bold text-primary">
                ${order.price?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Доставка</div>
              <div className="font-semibold">
                ${order.delivery_price_confirm?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Мест</div>
              <div className="font-semibold">
                {order.place_number || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Action Block */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onViewDetails(order.id)}
            className="flex-1 h-8 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Просмотр
          </Button>
          
          {showConfirmButton && onQuickAction && (
            <Button
              variant="default"
              onClick={() => onQuickAction(order.id, 'confirm')}
              className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Подтвердить
            </Button>
          )}
          
          {confirmImages.length > 0 ? (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={() => setIsConfirmImagesDialogOpen(true)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsConfirmImagesDialogOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
      <Dialog open={isConfirmImagesDialogOpen} onOpenChange={(isOpen) => {
        setIsConfirmImagesDialogOpen(isOpen);
        if (!isOpen) {
          queryClient.invalidateQueries({ queryKey: ['confirm-images', order.id] });
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-lg">
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
