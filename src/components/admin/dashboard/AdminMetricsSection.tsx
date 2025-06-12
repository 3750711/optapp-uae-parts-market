
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Package, ShoppingCart, Truck, AlertTriangle } from 'lucide-react';
import DashboardMetricCard from './DashboardMetricCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminMetrics {
  total_users: number;
  pending_users: number;
  total_products: number;
  pending_products: number;
  total_orders: number;
  non_processed_orders: number;
}

const AdminMetricsSection: React.FC = () => {
  const { data: metrics, isLoading, error, refetch } = useQuery({
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
    retry: (failureCount, error: any) => {
      // Не повторяем при ошибках доступа
      if (error?.message?.includes('Only administrators')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Показываем ошибку, если есть проблемы с загрузкой
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Ошибка загрузки метрик: {error.message}</span>
          <button 
            onClick={() => refetch()}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Повторить
          </button>
        </AlertDescription>
      </Alert>
    );
  }

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
