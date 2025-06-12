
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Package, ShoppingCart, Truck } from 'lucide-react';
import DashboardMetricCard from './DashboardMetricCard';

interface AdminMetrics {
  total_users: number;
  pending_users: number;
  total_products: number;
  pending_products: number;
  total_orders: number;
  non_processed_orders: number;
}

const AdminMetricsSection: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin', 'metrics-optimized'],
    queryFn: async () => {
      console.log('🔍 Fetching admin metrics with single RPC call...');
      const startTime = performance.now();
      
      const { data, error } = await supabase.rpc('get_admin_metrics');
      
      if (error) {
        console.error('❌ Error fetching admin metrics:', error);
        throw error;
      }

      const endTime = performance.now();
      console.log(`✅ Admin metrics loaded in ${(endTime - startTime).toFixed(2)}ms`);
      
      return data as AdminMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэш
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
    refetchOnWindowFocus: false,
  });

  const metricsData = [
    {
      title: "Пользователи",
      value: metrics?.total_users || 0,
      description: "Всего зарегистрированных пользователей",
      icon: Users,
      link: "/admin/users",
      highlight: (metrics?.pending_users || 0) > 0,
      warningText: (metrics?.pending_users || 0) > 0 ? `(${metrics?.pending_users} ожидает)` : null,
      isLoading
    },
    {
      title: "Товары",
      value: metrics?.total_products || 0,
      description: "Всего товаров в каталоге",
      icon: Package,
      link: "/admin/products",
      highlight: (metrics?.pending_products || 0) > 0,
      warningText: (metrics?.pending_products || 0) > 0 ? `(${metrics?.pending_products} ожидает проверки)` : null,
      isLoading
    },
    {
      title: "Заказы",
      value: metrics?.total_orders || 0,
      description: "Всего оформленных заказов",
      icon: ShoppingCart,
      link: "/admin/orders",
      highlight: (metrics?.non_processed_orders || 0) > 0,
      warningText: (metrics?.non_processed_orders || 0) > 0 ? `(${metrics?.non_processed_orders} не зарегистрировано)` : null,
      isLoading
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
      {metricsData.map((metric, index) => (
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
