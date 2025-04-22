import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, Truck, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data: userCount, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'user-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      return count;
    }
  });

  const { data: productCount, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin', 'product-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      return count;
    }
  });

  const { data: orderCount, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin', 'order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      return count;
    }
  });

  const { data: pendingOrderCount, isLoading: isLoadingPendingOrders } = useQuery({
    queryKey: ['admin', 'pending-order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'created');
      return count;
    }
  });

  const { data: processingOrderCount, isLoading: isLoadingProcessingOrders } = useQuery({
    queryKey: ['admin', 'processing-order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['created', 'seller_confirmed', 'admin_confirmed']);
      return count;
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Обзор системы</h1>
          <div className="text-sm text-muted-foreground">
            Последнее обновление: {new Date().toLocaleString('ru-RU')}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingUsers ? '...' : userCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего зарегистрированных пользователей
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Товары</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingProducts ? '...' : productCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего товаров в каталоге
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Заказы</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingOrders ? '...' : orderCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всего оформленных заказов
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Заказы в обработке</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingProcessingOrders ? '...' : processingOrderCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Заказы в процессе обработки
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
