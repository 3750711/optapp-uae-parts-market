
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BuyerOrders = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isSeller = profile?.user_type === 'seller';

  const { data: orders, isLoading } = useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const query = supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!orders_seller_id_fkey (
            phone,
            telegram
          )
        `);

      // If user is a seller, show orders they created and orders from their listings
      if (isSeller) {
        query.or(`seller_id.eq.${user.id},order_created_type.eq.ads_order`);
      } else {
        // If user is a buyer, only show their orders
        query.eq('buyer_id', user.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      console.log("Fetched orders:", data);
      return data || [];
    },
    enabled: !!user,
  });

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
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
        <h1 className="text-2xl font-bold mb-6">
          {isSeller ? 'Заказы по моим объявлениям' : 'Мои заказы'}
        </h1>
        
        {orders && orders.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер заказа</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Модель</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Тип заказа</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>{order.brand}</TableCell>
                    <TableCell>{order.model}</TableCell>
                    <TableCell>{order.order_seller_name}</TableCell>
                    <TableCell>{order.price} AED</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getOrderTypeLabel(order.order_created_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        order.status === 'created' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status === 'created' ? 'В обработке' : 'Подтвержден'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">У вас пока нет заказов</p>
            <Button 
              className="mt-4 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              onClick={() => navigate('/catalog')}
            >
              Перейти в каталог
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerOrders;
