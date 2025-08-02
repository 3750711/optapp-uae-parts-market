import React from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label }) => {
  return (
    <div className="text-center p-6 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-gray-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {value.toLocaleString()}
      </div>
      <p className="text-gray-600 font-medium">
        {label}
      </p>
    </div>
  );
};

const StatisticsSection: React.FC = () => {
  const { data: stats, isLoading } = useStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const statisticsData = [
    {
      icon: Package,
      value: stats?.totalProducts || 1373,
      label: "Размещённых автозапчастей",
    },
    {
      icon: ShoppingBag,
      value: stats?.totalOrders || 983,
      label: "Созданных заказов",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
      {statisticsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatisticsSection;