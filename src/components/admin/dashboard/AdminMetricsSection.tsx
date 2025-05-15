
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Package, ShoppingCart, Truck } from 'lucide-react';
import DashboardMetricCard from './DashboardMetricCard';

const AdminMetricsSection: React.FC = () => {
  const { data: userCount, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'user-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      return count;
    }
  });

  const { data: totalProductCount, isLoading: isLoadingTotalProducts } = useQuery({
    queryKey: ['admin', 'total-product-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      return count;
    }
  });

  const { data: pendingProductCount, isLoading: isLoadingPendingProducts } = useQuery({
    queryKey: ['admin', 'pending-product-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
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

  const { data: nonProcessedOrderCount, isLoading: isLoadingNonProcessedOrders } = useQuery({
    queryKey: ['admin', 'non-processed-order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'processed');
      return count;
    }
  });

  const { data: pendingUsersCount, isLoading: isLoadingPendingUsers } = useQuery({
    queryKey: ['admin', 'pending-users-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');
      return count;
    }
  });

  const metrics = [
    {
      title: "Пользователи",
      value: userCount || 0,
      description: "Всего зарегистрированных пользователей",
      icon: Users,
      link: "/admin/users",
      highlight: (pendingUsersCount || 0) > 0,
      warningText: (pendingUsersCount || 0) > 0 ? `(${pendingUsersCount} ожидает)` : null,
      isLoading: isLoadingUsers
    },
    {
      title: "Товары",
      value: totalProductCount || 0,
      description: "Всего товаров в каталоге",
      icon: Package,
      link: "/admin/products",
      highlight: (pendingProductCount || 0) > 0,
      warningText: (pendingProductCount || 0) > 0 ? `(${pendingProductCount} ожидает проверки)` : null,
      isLoading: isLoadingTotalProducts || isLoadingPendingProducts
    },
    {
      title: "Заказы",
      value: orderCount || 0,
      description: "Всего оформленных заказов",
      icon: ShoppingCart,
      link: "/admin/orders",
      highlight: (nonProcessedOrderCount || 0) > 0,
      warningText: (nonProcessedOrderCount || 0) > 0 ? `(${nonProcessedOrderCount} не зарегистрировано)` : null,
      isLoading: isLoadingOrders || isLoadingNonProcessedOrders
    },
    {
      title: "Логистика",
      value: "-",
      description: "Управление доставками",
      icon: Truck,
      link: "/admin/logistics",
      isLoading: false
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <DashboardMetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          link={metric.link}
          highlight={metric.highlight}
          warningText={metric.warningText}
          isLoading={metric.isLoading}
        />
      ))}
    </div>
  );
};

export default AdminMetricsSection;
