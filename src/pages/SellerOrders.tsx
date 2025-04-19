import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ChevronRight, Link, Loader2 } from "lucide-react";

type OrderStatus = "created" | "seller_confirmed" | "admin_confirmed" | "processed" | "shipped" | "delivered";

const SellerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
          )
        `)
        .or(`seller_id.eq.${user.id},order_created_type.eq.ads_order`)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      console.log("Fetched orders with buyer info:", data);
      return data || [];
    },
    enabled: !!user?.id
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'seller_confirmed' as OrderStatus })
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
              status: updatedOrder.status
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'admin_confirmed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'processed':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
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

  const handleRowClick = (orderId: string) => {
    navigate(`/seller/orders/${orderId}`);
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
      <div className="container mx-auto py-4 px-2 md:py-8 md:px-4">
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Мои заказы</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Управление созданными заказами и заказами по объявлениям
            </p>
          </div>
          
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Список заказов</CardTitle>
            </CardHeader>
            <CardContent>
              {!orders || orders.length === 0 ? (
                <div className="text-center p-4 md:p-8 text-muted-foreground">
                  У вас пока нет заказов
                </div>
              ) : isMobile ? (
                // Mobile view - cards layout
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card 
                      key={order.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleRowClick(order.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-sm">№ {order.order_number}</p>
                            <h3 className="font-semibold mb-1">{order.title}</h3>
                          </div>
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Бренд:</span>
                            <span>{order.brand}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Модель:</span>
                            <span>{order.model}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Цена:</span>
                            <span>{order.price} AED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">OPT_ID Покупателя:</span>
                            <Badge variant="outline" className="font-mono justify-self-start">
                              {order.buyer_opt_id || 'Не указан'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Контакты:</span>
                            <div>
                              {order.buyer?.telegram ? (
                                <a 
                                  href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {order.buyer.telegram}
                                  <Link className="h-3 w-3" />
                                </a>
                              ) : (
                                'Не указан'
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground">Тип заказа:</span>
                            <Badge variant="outline">
                              {getOrderTypeLabel(order.order_created_type)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Desktop view - table layout
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Номер заказа</TableHead>
                        <TableHead>Наименование</TableHead>
                        <TableHead>Бренд</TableHead>
                        <TableHead>Модель</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>OPT_ID Покупателя</TableHead>
                        <TableHead>Контакты покупателя</TableHead>
                        <TableHead>Тип заказа</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
                              e.stopPropagation();
                              return;
                            }
                            handleRowClick(order.id);
                          }}
                        >
                          <TableCell>{order.order_number}</TableCell>
                          <TableCell>{order.title}</TableCell>
                          <TableCell>{order.brand}</TableCell>
                          <TableCell>{order.model}</TableCell>
                          <TableCell>{order.price} AED</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {order.buyer_opt_id || 'Не указан'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.buyer?.telegram ? (
                              <a 
                                href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {order.buyer.telegram}
                                <Link className="h-4 w-4" />
                              </a>
                            ) : (
                              'Не указан'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getOrderTypeLabel(order.order_created_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerOrders;
