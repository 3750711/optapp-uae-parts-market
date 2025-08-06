import React from 'react';
import { Package, Bell, TrendingUp, Clock } from 'lucide-react';
import { useBuyerStats } from '@/hooks/useBuyerStats';

export const UserStats: React.FC = () => {
  const { data: stats, isLoading } = useBuyerStats();

  const statItems = [
    {
      icon: Package,
      label: 'Активные заказы',
      value: stats?.activeOrders || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Bell,
      label: 'Уведомления',
      value: stats?.notifications || 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: TrendingUp,
      label: 'Всего заказов',
      value: stats?.totalOrders || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Clock,
      label: 'В обработке',
      value: stats?.pendingOrders || 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-100 rounded mb-2 animate-pulse" />
                <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div 
          key={index}
          className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm text-slate-600">{item.label}</p>
              <p className="text-2xl font-semibold text-slate-800">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};