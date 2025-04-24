import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Link, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderConfirmButton } from "@/components/order/OrderConfirmButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import OrderPriceConfirmDialog from "@/components/order/OrderPriceConfirmDialog";
import { Check } from "lucide-react";
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';

type OrderStatus = "created" | "seller_confirmed" | "admin_confirmed" | "processed" | "shipped" | "delivered" | "cancelled";

const SellerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram
          ),
          seller:profiles!orders_seller_id_fkey (
            opt_status
          )
        `)
        .or(`seller_id.eq.${user.id},order_created_type.eq.ads_order`)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      const ordersWithConfirmations = await Promise.all(data.map(async (order) => {
        const { data: confirmImages } = await supabase
          .from('confirm_images')
          .select('url')
          .eq('order_id', order.id);
        
        return {
          ...order,
          hasConfirmImages: confirmImages && confirmImages.length > 0
        };
      }));
      
      return ordersWithConfirmations || [];
    },
    enabled: !!user?.id
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async ({ orderId, newPrice }: { orderId: string; newPrice: number }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'seller_confirmed' as OrderStatus,
          price: newPrice
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }
      
      console.log("Updated order status:", data);
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['seller-orders', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((order: any) => {
          if (order.id === updatedOrder.id) {
            return {
              ...order,
              status: updatedOrder.status,
              price: updatedOrder.price
            };
          }
          return order;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      toast({
        title: "Заказ подтвержден",
        description: "Статус заказа успешно обновлен",
      });

      setIsPriceDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Error confirming order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить заказ",
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' as OrderStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error("Error cancelling order:", error);
        throw error;
      }
      
      console.log("Cancelled order:", data);
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['seller-orders', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((order: any) => {
          if (order.id === updatedOrder.id) {
            return {
              ...order,
              status: updatedOrder.status
            };
          }
          return order;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      toast({
        title: "Заказ отменен",
        description: "Статус заказа успешно обновлен",
      });
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отменить заказ",
        variant: "destructive",
      });
    },
  });

  const handleConfirmOrder = (orderId: string, currentPrice: number) => {
    setSelectedOrder({ id: orderId, price: currentPrice });
    setIsPriceDialogOpen(true);
  };

  const getCardHighlightColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-50';
      case 'seller_confirmed':
        return 'bg-blue-50';
      case 'admin_confirmed':
        return 'bg-green-50';
      case 'processed':
        return 'bg-[#F2FCE2] border-green-200 border-2 shadow-md';
      case 'created':
        return 'bg-yellow-50 animate-pulse-soft border-2 border-yellow-200 shadow-md';
      default:
        return '';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'created':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'admin_confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'processed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return 'Создан';
      case 'seller_confirmed':
        return 'Подтвержден продавцом';
      case 'admin_confirmed':
        return 'Подтвержден администратором';
      case 'processed':
        return 'В обработке';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      default:
        return status;
    }
  };

  const getOrderTypeLabel = (type: 'free_order' | 'ads_order') => {
    return type === 'free_order' ? 'Свободный заказ' : 'Заказ по объявлению';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Мои заказы</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Управление созданными заказами и заказами по объявлениям
            </p>
          </div>
          
          <Separator />

          {orders && orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders?.map((order) => (
                <Card 
                  key={order.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${getCardHighlightColor(order.status)}`}
                  onClick={() => navigate(`/seller/orders/${order.id}`)}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {order.hasConfirmImages && (
                        <div 
                          className="flex items-center gap-2 text-green-600 text-sm cursor-pointer hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <OrderConfirmImagesDialog orderId={order.id} />
                        </div>
                      )}
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">№ {order.order_number}</CardTitle>
                      {order.lot_number_order && (
                        <div className="text-sm text-muted-foreground">
                          Лот: {order.lot_number_order}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium">{order.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.brand} {order.model}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="font-medium text-lg">{order.price} $</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium">Мест для отправки:</span>
                        <span>{order.place_number || 1}</span>
                      </div>
                    </div>

                    {order.seller?.opt_status === 'opt_user' && order.delivery_price_confirm && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Стоимость доставки:</span>
                        <span>{order.delivery_price_confirm} $</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Покупатель</div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono">
                          {order.buyer_opt_id || 'Не указан'}
                        </Badge>
                        {order.buyer?.telegram && (
                          <a
                            href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.buyer.telegram}
                            <Link className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {order.text_order && order.text_order.trim() !== "" && (
                      <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                        <span className="font-medium">Дополнительная информация:</span>
                        <p className="mt-1 whitespace-pre-wrap line-clamp-3">{order.text_order}</p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <Badge variant="outline">
                        {getOrderTypeLabel(order.order_created_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      {order.status === 'created' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmOrder(order.id, order.price);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Подтвердить
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Отменить
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Отменить заказ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите отменить заказ? Это действие нельзя будет отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                  Отмена
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelOrderMutation.mutate(order.id);
                                  }}
                                >
                                  Подтвердить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      
                      {order.status === 'admin_confirmed' && (
                        <div className="w-full pt-2" onClick={(e) => e.stopPropagation()}>
                          <OrderConfirmButton orderId={order.id} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 md:p-8 text-muted-foreground">
              У вас пока нет заказов
            </div>
          )}
        </div>
      </div>

      <OrderPriceConfirmDialog
        open={isPriceDialogOpen}
        onOpenChange={setIsPriceDialogOpen}
        currentPrice={selectedOrder?.price || 0}
        onConfirm={(newPrice) => {
          if (selectedOrder) {
            confirmOrderMutation.mutate({ 
              orderId: selectedOrder.id, 
              newPrice 
            });
          }
        }}
        isSubmitting={confirmOrderMutation.isPending}
      />
    </Layout>
  );
};

export default SellerOrders;
