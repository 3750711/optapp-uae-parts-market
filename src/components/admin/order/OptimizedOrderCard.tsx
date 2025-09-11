import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, CheckCircle, Eye, MoreVertical, Camera, Package, DollarSign, MapPin } from "lucide-react";
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { OrderCreationTypeBadge } from '@/components/order/OrderCreationTypeBadge';
import { ResendNotificationButton } from './ResendNotificationButton';
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';
import { OrderConfirmThumbnails } from '@/components/order/OrderConfirmThumbnails';
import { OrderConfirmEvidenceWizard } from '@/components/admin/OrderConfirmEvidenceWizard';
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OptimizedOrderCardProps {
  order: Order;
  isSelected?: boolean;
  onSelect?: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
  isMobile?: boolean;
  showSelection?: boolean;
}

export const OptimizedOrderCard: React.FC<OptimizedOrderCardProps> = ({
  order,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction,
  isMobile = false,
  showSelection = false
}) => {
  const [isConfirmImagesDialogOpen, setIsConfirmImagesDialogOpen] = useState(false);
  const [isViewImagesDialogOpen, setIsViewImagesDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: confirmImages = [] } = useQuery({
    queryKey: ['confirm-images', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('id')
        .eq('order_id', order.id);
      if (error) return [];
      return data || [];
    },
  });

  // Status-based gradient backgrounds
  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-gradient-to-br from-success/10 to-success/5 border-success/20';
      case 'created':
      case 'seller_confirmed':
        return 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
      case 'admin_confirmed':
        return 'bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20';
      case 'shipped':
        return 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20';
      case 'delivered':
        return 'bg-gradient-to-br from-success/10 to-success/5 border-success/20';
      case 'cancelled':
        return 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20';
      default:
        return 'bg-card border-border';
    }
  };

  const totalValue = Number(order.price || 0) + Number(order.delivery_price_confirm || 0);
  const showConfirmButton = !['processed', 'cancelled', 'delivered', 'shipped'].includes(order.status);
  const cardGradient = getStatusGradient(order.status);

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
      
      // Send notification
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
        console.error('Notification error:', notifyError);
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
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось зарегистрировать заказ",
        variant: "destructive",
      });
    }
  };

  return (
    <Card 
      className={`
        ${cardGradient} 
        hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 
        ${isSelected ? 'ring-2 ring-primary ring-opacity-50' : ''} 
        ${isMobile ? 'min-w-[320px]' : 'h-[350px]'}
        flex flex-col
      `}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Compact Header - Single Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(order.id)}
                className="shrink-0"
              />
            )}
            
            <OrderImageThumbnail 
              orderId={order.id} 
              size="thumbnail" 
              className="w-10 h-10 shrink-0"
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  №{order.order_number}
                </Badge>
                <EnhancedOrderStatusBadge 
                  status={order.status} 
                  size="sm" 
                  compact={true} 
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('ru-RU', { 
                  day: '2-digit', 
                  month: '2-digit',
                  ...(isMobile ? {} : { year: 'numeric', hour: '2-digit', minute: '2-digit' })
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {confirmImages.length > 0 && (
              <Badge variant="secondary" className="h-6 px-2 text-xs">
                <Camera className="h-3 w-3 mr-1" />
                {confirmImages.length}
              </Badge>
            )}
            
            <ResendNotificationButton 
              orderId={order.id}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
              size="icon"
              className="h-7 w-7"
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
                <DropdownMenuItem 
                  onClick={() => onDelete(order)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Product Title */}
        <div className="mb-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {order.title || 'Без названия'}
          </h3>
          {(order.brand || order.model) && (
            <p className="text-xs text-muted-foreground">
              {[order.brand, order.model].filter(Boolean).join(' ')}
            </p>
          )}
        </div>

        {/* Participants Grid 2×1 */}
        <div className="grid grid-cols-2 gap-3 mb-3 bg-muted/30 rounded-lg p-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Продавец</div>
            <div className="text-xs font-medium truncate">
              {order.seller?.full_name || 'Не указан'}
            </div>
            {order.seller?.opt_id && (
              <Badge variant="outline" className="text-xs mt-1 text-primary">
                {order.seller.opt_id}
              </Badge>
            )}
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Покупатель</div>
            <div className="text-xs font-medium truncate">
              {order.buyer?.full_name || 'Не указан'}
            </div>
            {order.buyer?.opt_id && (
              <Badge variant="outline" className="text-xs mt-1 text-accent">
                {order.buyer.opt_id}
              </Badge>
            )}
          </div>
        </div>

        {/* Financial Block 1×3 - Highlighted */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground mb-1 flex items-center justify-center">
                <Package className="h-3 w-3 mr-1" />
                Товар
              </div>
              <div className="font-bold text-primary">
                ${order.price?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1 flex items-center justify-center">
                <DollarSign className="h-3 w-3 mr-1" />
                {isMobile ? 'Дост.' : 'Доставка'}
              </div>
              <div className="font-semibold">
                ${order.delivery_price_confirm?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1 flex items-center justify-center">
                <MapPin className="h-3 w-3 mr-1" />
                Мест
              </div>
              <div className="font-semibold">
                {order.place_number || 0}
              </div>
            </div>
          </div>
          
          {order.delivery_price_confirm && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/10">
              <span className="text-xs font-medium">Итого:</span>
              <span className="font-bold text-primary">${totalValue.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Inline Metadata with Compact Icons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <OrderCreationTypeBadge 
            orderCreatedType={order.order_created_type as any}
            sellerUserType={order.seller?.user_type}
            className="text-xs"
          />
          {order.delivery_method && (
            <Badge variant="secondary" className="text-xs">
              {order.delivery_method === 'self_pickup' ? 'Самовывоз' : 
               order.delivery_method === 'cargo_rf' ? 'Cargo РФ' : 
               order.delivery_method === 'cargo_kz' ? 'Cargo KZ' : 'Не указан'}
            </Badge>
          )}
        </div>

        {/* Actions Panel - Grouped */}
        <div className="mt-auto space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(order.id)}
              className="flex-1 h-8 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Детали
            </Button>
            
            {showConfirmButton && (
              <Button
                variant="default"
                onClick={order.status === 'admin_confirmed' ? handleRegister : handleConfirm}
                className="h-8 px-3 text-xs bg-success hover:bg-success/90 text-white shrink-0"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {order.status === 'admin_confirmed' ? 
                  (isMobile ? 'Регистр.' : 'Зарегистрировать') : 
                  'Подтвердить'}
              </Button>
            )}
          </div>
          
          <OrderConfirmThumbnails
            orderId={order.id}
            onViewPhotos={() => setIsViewImagesDialogOpen(true)}
            onUpload={() => setIsConfirmImagesDialogOpen(true)}
          />
        </div>
      </CardContent>
      
      <OrderConfirmEvidenceWizard
        open={isConfirmImagesDialogOpen}
        orderId={order.id}
        onComplete={() => {
          setIsConfirmImagesDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['confirm-images', order.id] });
        }}
        onCancel={() => setIsConfirmImagesDialogOpen(false)}
      />
      
      <OrderConfirmImagesDialog
        orderId={order.id}
        open={isViewImagesDialogOpen}
        onOpenChange={setIsViewImagesDialogOpen}
      />
    </Card>
  );
};