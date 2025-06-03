
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Package, PackageCheck, PackageX, Truck, CalendarClock, Check } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderConfirmButton } from '@/components/order/OrderConfirmButton';
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import OrdersSearchBar from '@/components/orders/OrdersSearchBar';
import { useOrdersSearch } from '@/hooks/useOrdersSearch';

const statusColors = {
  created: 'bg-gray-100 text-gray-800',
  seller_confirmed: 'bg-blue-100 text-blue-800',
  admin_confirmed: 'bg-purple-100 text-purple-800',
  processed: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  created: <CalendarClock className="w-5 h-5 text-gray-400" />,
  seller_confirmed: <Check className="w-5 h-5 text-blue-500" />,
  admin_confirmed: <PackageCheck className="w-5 h-5 text-purple-500" />,
  processed: <Package className="w-5 h-5 text-yellow-500" />,
  shipped: <Truck className="w-5 h-5 text-orange-500" />,
  delivered: <PackageCheck className="w-5 h-5 text-green-500" />,
  cancelled: <PackageX className="w-5 h-5 text-red-500" />,
};

const statusLabels = {
  created: 'Создан',
  seller_confirmed: 'Подтвержден продавцом',
  admin_confirmed: 'Подтвержден администратором',
  processed: 'Зарегистрирован',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const orderTypeLabels = {
  free_order: 'Свободный заказ',
  ads_order: 'Заказ по объявлению',
};

const deliveryMethodLabels = {
  self_pickup: 'Самовывоз',
  cargo_russia: 'Cargo РФ',
  cargo_kazakhstan: 'Cargo КЗ',
};

const BuyerOrders = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isSeller = profile?.user_type === 'seller';
  const [searchTerm, setSearchTerm] = useState('');

  console.log('🔍 BuyerOrders component render:', {
    userId: user?.id,
    userType: profile?.user_type,
    isSeller
  });

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['buyer-orders', user?.id, isSeller],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID found');
        return [];
      }

      console.log('🔍 Starting orders fetch for user:', user.id);
      
      try {
        // Упрощенный запрос без сложной логики
        let query = supabase
          .from('orders')
          .select(`
            *,
            products (
              lot_number
            ),
            seller:profiles!orders_seller_id_fkey (
              phone,
              telegram,
              opt_id
            )
          `);

        // Простая логика фильтрации
        if (isSeller) {
          console.log('🔍 Fetching orders for seller:', user.id);
          query = query.eq('seller_id', user.id);
        } else {
          console.log('🔍 Fetching orders for buyer:', user.id);
          query = query.eq('buyer_id', user.id);
        }
        
        const { data: ordersData, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error fetching orders:', error);
          throw error;
        }

        console.log('✅ Orders fetched successfully:', {
          count: ordersData?.length || 0,
          orders: ordersData
        });

        // Добавляем информацию о изображениях подтверждения
        const ordersWithConfirmations = await Promise.all((ordersData || []).map(async (order) => {
          // Добавляем отладочную информацию о методе доставки
          console.log('📦 Order delivery info:', {
            orderId: order.id,
            orderNumber: order.order_number,
            deliveryMethod: order.delivery_method,
            deliveryMethodType: typeof order.delivery_method
          });

          try {
            const { data: confirmImages, error: confirmError } = await supabase
              .from('confirm_images')
              .select('url')
              .eq('order_id', order.id);

            if (confirmError) {
              console.error('⚠️ Error fetching confirm images for order:', order.id, confirmError);
            }
            
            return {
              ...order,
              hasConfirmImages: confirmImages && confirmImages.length > 0
            };
          } catch (err) {
            console.error('⚠️ Error processing order:', order.id, err);
            return {
              ...order,
              hasConfirmImages: false
            };
          }
        }));

        console.log('✅ Orders with confirmations processed:', ordersWithConfirmations.length);
        return ordersWithConfirmations;
        
      } catch (err) {
        console.error('❌ Critical error in orders fetch:', err);
        throw err;
      }
    },
    enabled: !!user,
    staleTime: 15000,
    retry: 2,
    retryDelay: 1000
  });

  // Используем хук поиска
  const { filteredOrders, hasActiveSearch } = useOrdersSearch(orders || [], searchTerm);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  console.log('🔍 Query result:', {
    isLoading,
    error: error?.message,
    ordersCount: orders?.length,
    filteredCount: filteredOrders?.length,
    searchTerm,
    hasActiveSearch
  });

  if (isLoading) {
    console.log('⏳ Loading orders...');
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <svg className="h-8 w-8 animate-spin text-optapp-yellow" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('❌ Component error state:', error);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Ошибка загрузки заказов: {error.message}</p>
            <Button
              onClick={() => refetch()}
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('✅ Rendering orders page with orders:', filteredOrders?.length || 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">
            {isSeller ? 'Заказы по моим объявлениям' : 'Мои заказы'}
          </h1>
        </div>

        {/* Поиск */}
        <OrdersSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClear={handleClearSearch}
        />

        {/* Результаты поиска */}
        {hasActiveSearch && (
          <div className="mb-4 text-sm text-gray-600">
            Найдено: {filteredOrders?.length || 0} из {orders?.length || 0} заказов
          </div>
        )}

        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-md border hover:shadow-xl transition-all p-4 relative
                  ${order.status === 'delivered' ? 'border-green-200' :
                    order.status === 'cancelled' ? 'border-red-200' :
                    order.status === 'seller_confirmed' ? 'border-blue-200' :
                    order.status === 'admin_confirmed' ? 'border-purple-200' :
                    order.status === 'shipped' ? 'border-orange-200' :
                    order.status === 'processed' ? 'border-yellow-200' :
                    'border-gray-100'
                  }
                `}
              >
                {/* Логотип OPTCargo в правом верхнем углу - улучшенная версия */}
                {order.delivery_method === 'cargo_russia' && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 px-4 py-2 rounded-lg shadow-lg border border-yellow-300">
                      <span className="text-white font-bold text-sm tracking-wider drop-shadow-sm">
                        OPTCargo
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {statusIcons[order.status] || statusIcons['created']}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">Заказ № {order.order_number}</span>
                        <Badge className={`text-sm px-2 py-1 ${statusColors[order.status] || statusColors["created"]}`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Лот: {order.products?.lot_number || "Н/Д"}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {order.hasConfirmImages && (
                      <OrderConfirmImagesDialog orderId={order.id} />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {order.created_at && new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-medium text-base mb-1">{order.title}</div>
                  <div className="text-sm text-muted-foreground mb-2">{order.brand} {order.model}</div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg text-optapp-dark">{order.price} $</span>
                    <span className="text-xs text-gray-500">{order.place_number ? `Мест: ${order.place_number}` : null}</span>
                  </div>
                  
                  {order.delivery_price_confirm && (
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Стоимость доставки:</span>
                      <span className="font-medium text-optapp-dark">{order.delivery_price_confirm} $</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline">{orderTypeLabels[order.order_created_type] || order.order_created_type}</Badge>
                    <Badge variant="outline">
                      {order.buyer_opt_id || 'Не указан'}
                    </Badge>
                    {/* Отображение типа доставки - улучшенная версия с отладкой */}
                    {order.delivery_method && (
                      <Badge 
                        variant="outline" 
                        className={`text-gray-600 ${order.delivery_method === 'cargo_russia' ? 'border-yellow-400 text-yellow-700' : ''}`}
                      >
                        {deliveryMethodLabels[order.delivery_method] || order.delivery_method}
                        {/* Временная отладочная информация */}
                        <span className="ml-1 text-xs opacity-50">({order.delivery_method})</span>
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 mb-2">
                    <div className="flex items-center justify-between">
                      <span>Продавец: <span className="font-medium">{order.order_seller_name}</span></span>
                      {(order.seller?.opt_id || order.seller_opt_id) && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          OPT ID: {order.seller?.opt_id || order.seller_opt_id}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {order.text_order && order.text_order.trim() !== "" && (
                    <div className="text-sm text-gray-600 mb-3 border-t pt-2">
                      <span className="font-medium">Доп. информация:</span>
                      <p className="mt-1 whitespace-pre-wrap">{order.text_order}</p>
                    </div>
                  )}
                </div>

                {order.status === 'admin_confirmed' && isSeller && (
                  <div className="mb-3">
                    <OrderConfirmButton orderId={order.id} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t bg-gray-50 -mx-4 px-4 py-3 rounded-b-xl">
                  {order.id ? (
                    <Link
                      to={`/order/${order.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      Подробнее
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">Недоступно</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {hasActiveSearch ? (
              <>
                <p className="text-gray-500 mb-4">По вашему запросу "{searchTerm}" ничего не найдено</p>
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  className="mr-4"
                >
                  Очистить поиск
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500">У вас пока нет заказов</p>
                <Button
                  className="mt-4 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  onClick={() => navigate('/catalog')}
                >
                  Перейти в каталог
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerOrders;
