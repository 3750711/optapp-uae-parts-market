import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Package, User, FileText, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Order } from '@/types/order';
import { Profile } from '@/types/profile';
import { Product } from '@/types/product';
import OrderVideos from '@/components/order/OrderVideos';
import OrderConfirmationCard from '@/components/order/OrderConfirmationCard';
import { ScrollArea } from "@/components/ui/scroll-area"

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: order, isLoading: isOrderLoading } = useQuery(
    ['order', id],
    async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data as Order;
    }
  );

  const { data: buyer, isLoading: isBuyerLoading } = useQuery(
    ['buyer', order?.buyer_id],
    async () => {
      if (!order?.buyer_id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.buyer_id)
        .single();

      if (error) {
        console.error('Error fetching buyer:', error);
        return null;
      }

      return data as Profile;
    },
    {
      enabled: !!order?.buyer_id,
    }
  );

  const { data: seller, isLoading: isSellerLoading } = useQuery(
    ['seller', order?.seller_id],
    async () => {
      if (!order?.seller_id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.seller_id)
        .single();

      if (error) {
        console.error('Error fetching seller:', error);
        return null;
      }

      return data as Profile;
    },
    {
      enabled: !!order?.seller_id,
    }
  );

  const { data: products, isLoading: isProductsLoading } = useQuery(
    ['products', order?.products],
    async () => {
      if (!order?.products || order.products.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', order.products);

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data as Product[];
    },
    {
      enabled: !!order?.products,
    }
  );

  const isLoading = isOrderLoading || isBuyerLoading || isSellerLoading || isProductsLoading;

  if (isLoading || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Загрузка...</CardTitle>
              <CardDescription>Получение информации о заказе</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Пожалуйста, подождите...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Детали заказа #{order.id}</CardTitle>
            <CardDescription>Информация о заказе и участниках</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Информация о заказе</h3>
                <div className="space-y-2">
                  <p>
                    <CalendarClock className="inline-block h-4 w-4 mr-1" />{' '}
                    Дата создания:{' '}
                    {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                  <p>
                    <FileText className="inline-block h-4 w-4 mr-1" /> Статус: {order.status}
                  </p>
                  <p>
                    <Package className="inline-block h-4 w-4 mr-1" /> Адрес доставки: {order.delivery_address}
                  </p>
                  <p>
                    <Image className="inline-block h-4 w-4 mr-1" /> Цена доставки: {order.delivery_price}
                  </p>
                  <p>
                    <Image className="inline-block h-4 w-4 mr-1" /> Общая цена: {order.total_price}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Участники</h3>
                <div className="space-y-2">
                  <p>
                    <User className="inline-block h-4 w-4 mr-1" /> Покупатель: {buyer?.full_name}
                  </p>
                  <p>
                    <User className="inline-block h-4 w-4 mr-1" /> Продавец: {seller?.full_name}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Товары</h3>
              {products && products.length > 0 ? (
                <ul>
                  {products.map((product) => (
                    <li key={product.id} className="mb-1">
                      {product.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Нет товаров в этом заказе.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OrderDetails;
