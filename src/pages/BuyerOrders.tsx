
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
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
          product_id,
          seller:profiles!orders_seller_id_fkey (
            phone,
            telegram,
            opt_id
          )
        `);

      if (isSeller) {
        query.or(`seller_id.eq.${user.id},order_created_type.eq.ads_order`);
      } else {
        query.eq('buyer_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const getOrderTypeLabel = (type: 'free_order' | 'ads_order') => {
    return type === 'free_order' ? 'Свободный заказ' : 'Заказ по объявлению';
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
                  <TableHead>OPT ID</TableHead>
                  <TableHead>Тип заказа</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>{order.brand}</TableCell>
                    <TableCell>{order.model}</TableCell>
                    <TableCell>{order.order_seller_name}</TableCell>
                    <TableCell>{order.price} $</TableCell>
                    <TableCell>{order.buyer_opt_id || 'Не указан'}</TableCell>
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
                      <Link 
                        to={`/product/${order.product_id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      >
                        Подробнее
                      </Link>
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
