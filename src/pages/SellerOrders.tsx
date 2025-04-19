import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, ChevronRight } from "lucide-react";

const SellerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getOrderTypeLabel = (type: 'free_order' | 'ads_order') => {
    return type === 'free_order' ? 'Свободный заказ' : 'Заказ по объявлению';
  };

  const handleRowClick = (orderId: string) => {
    navigate(`/seller/orders/${orderId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Мои заказы</h1>
            <p className="text-muted-foreground mt-1">
              Просмотр и управление вашими заказами
            </p>
          </div>
          
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle>Список заказов</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  У вас пока нет заказов
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Модель</TableHead>
                        <TableHead>Бренд</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Тип заказа</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleRowClick(order.id)}
                        >
                          <TableCell>{order.order_number}</TableCell>
                          <TableCell>{order.title}</TableCell>
                          <TableCell>{order.model}</TableCell>
                          <TableCell>{order.brand}</TableCell>
                          <TableCell>{order.price} ₽</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getOrderTypeLabel(order.order_created_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {order.status === 'pending' ? 'В обработке' : 
                               order.status === 'verified' ? 'Подтвержден' : 
                               order.status}
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
