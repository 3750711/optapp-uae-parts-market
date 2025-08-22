
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Eye,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerDashboardTranslations, getSellerDashboardTranslations } from "@/utils/translations/sellerDashboard";
import { useLanguage } from "@/hooks/useLanguage";

const SellerStats = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const t = getSellerDashboardTranslations(profile?.user_type === 'seller' ? language : 'ru');

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['seller-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');

      // Parallel queries for better performance
      const [productsData, ordersData, recentOrdersData] = await Promise.all([
        // Products stats
        supabase
          .from('products')
          .select('status, price, created_at')
          .eq('seller_id', user.id),
        
        // Orders stats
        supabase
          .from('orders')
          .select('status, price, created_at')
          .eq('seller_id', user.id),
        
        // Recent orders for trend analysis
        supabase
          .from('orders')
          .select('price, created_at')
          .eq('seller_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      if (productsData.error) throw productsData.error;
      if (ordersData.error) throw ordersData.error;
      if (recentOrdersData.error) throw recentOrdersData.error;

      const products = productsData.data || [];
      const orders = ordersData.data || [];
      const recentOrders = recentOrdersData.data || [];

      return {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        pendingProducts: products.filter(p => p.status === 'pending').length,
        soldProducts: products.filter(p => p.status === 'sold').length,
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        pendingOrders: orders.filter(o => o.status === 'created' || o.status === 'confirmed').length,
        totalRevenue: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (Number(o.price) || 0), 0),
        monthlyRevenue: recentOrders
          .reduce((sum, o) => sum + (Number(o.price) || 0), 0),
        recentOrdersCount: recentOrders.length,
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0) / orders.length 
          : 0
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-2">{t.stats.errorLoading}</p>
            <button 
              onClick={() => refetch()}
              className="text-sm text-red-800 underline hover:no-underline"
            >
              {t.stats.retry}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      detail: `${stats?.activeProducts || 0} active`
    },
    {
      title: "Pending",
      value: stats?.pendingProducts || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      detail: "products in review"
    },
    {
      title: "Sold",
      value: stats?.soldProducts || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      detail: "products total"
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      detail: `${stats?.completedOrders || 0} completed`
    },
    {
      title: "Active Orders",
      value: stats?.pendingOrders || 0,
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      detail: "in progress"
    },
    {
      title: "Total Revenue",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} AED`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      detail: "all time",
      isRevenue: true
    },
    {
      title: "This Month",
      value: `${(stats?.monthlyRevenue || 0).toLocaleString()} AED`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      detail: `${stats?.recentOrdersCount || 0} orders`,
      isRevenue: true
    },
    {
      title: "Average Order",
      value: `${(stats?.averageOrderValue || 0).toFixed(0)} AED`,
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      detail: "per order",
      isRevenue: true
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistics</h3>
        <Badge variant="outline" className="text-xs">
          {t.stats.lastUpdated}: {new Date().toLocaleTimeString()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color} ${card.isRevenue ? 'text-lg sm:text-xl' : ''}`}>
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {card.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SellerStats;
