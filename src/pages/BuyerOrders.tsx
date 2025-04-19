import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useNavigate } from 'react-router-dom';

const BuyerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
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
        <h1 className="text-2xl font-bold mb-6">Мои заказы</h1>
        
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
                    <TableCell>{order.seller_name_order}</TableCell>
                    <TableCell>{order.price} AED</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status === 'pending' ? 'В обработке' : 'Подтвержден'}
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
