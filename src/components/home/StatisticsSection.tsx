import React from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { getMainPageTranslations } from '@/utils/mainPageTranslations';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label }) => {
  return (
    <div className="text-center p-6 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-3xl font-bold text-foreground mb-2">
        {value.toLocaleString()}
      </div>
      <p className="text-muted-foreground font-medium">
        {label}
      </p>
    </div>
  );
};

interface StatisticsSectionProps {
  language?: 'ru' | 'en';
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ language = 'ru' }) => {
  const { data: stats, isLoading } = useStatistics();
  const t = getMainPageTranslations(language);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg"></div>
        ))}
      </div>
    );
  }

  const statisticsData = [
    {
      icon: Package,
      value: stats?.totalProducts || 1373,
      label: t.statistics.partsListed,
    },
    {
      icon: ShoppingBag,
      value: stats?.lastOrderNumber || 983,
      label: t.statistics.ordersCreated,
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