
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Link, CheckCircle } from "lucide-react";
import { Database } from '@/integrations/supabase/types';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

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
  } | null;
};

interface AdminOrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export const AdminOrderCard: React.FC<AdminOrderCardProps> = ({ order, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const shouldHighlight = 
    order.status === 'created' || 
    order.status === 'seller_confirmed' || 
    order.status === 'processed';

  const highlightColor = 
    order.status === 'processed' ? 'bg-[#F2FCE2]' : // Green-like highlight
    order.status === 'created' || order.status === 'seller_confirmed' ? 'bg-[#FEF7CD]' : // Yellow highlight
    '';

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

      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить заказ",
        variant: "destructive",
      });
    }
  };

  const showConfirmButton = order.status === 'created' || order.status === 'seller_confirmed';

  return (
    <Card className={`h-full ${highlightColor}`}>
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">№ {order.order_number}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="font-medium">{order.title}</div>
          <div className="text-sm text-muted-foreground">
            {order.brand} {order.model}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Продавец</div>
          <div className="space-y-1">
            <div>{order.seller?.full_name || 'Не указано'}</div>
            {order.seller?.opt_id && (
              <Badge variant="outline" className="font-mono">
                {order.seller.opt_id}
              </Badge>
            )}
            {order.seller?.telegram && (
              <a
                href={`https://t.me/${order.seller.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {order.seller.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Покупатель</div>
          <div className="space-y-1">
            <div>{order.buyer?.full_name || 'Не указано'}</div>
            {order.buyer?.opt_id && (
              <Badge variant="outline" className="font-mono">
                {order.buyer.opt_id}
              </Badge>
            )}
            {order.buyer?.telegram && (
              <a
                href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                {order.buyer.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="font-medium text-lg">{order.price} AED</div>
          <div className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString('ru-RU')}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          {showConfirmButton && (
            <Button
              variant="outline"
              size="icon"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleConfirm}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(order)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={() => onDelete(order)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
