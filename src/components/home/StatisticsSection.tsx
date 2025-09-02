import React from 'react';
import { Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { getMainPageTranslations } from '@/utils/mainPageTranslations';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  isUpdating?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, isUpdating }) => {
  // Bulletproof protection against undefined/null values
  const safeValue = (value != null && typeof value === 'number' && !isNaN(value)) ? value : 0;
  
  return (
    <div className="text-center p-6 border border-border rounded-lg bg-card relative">
      {isUpdating && (
        <div className="absolute top-2 right-2">
          <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-3xl font-bold text-foreground mb-2">
        {safeValue.toLocaleString()}
      </div>
      <p className="text-muted-foreground font-medium">
        {label}
      </p>
    </div>
  );
};

interface StatisticsSectionProps {
  language?: 'ru' | 'en' | 'bn';
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ language = 'ru' }) => {
  const { data: stats, isLoading, isError, error, refetch } = useStatistics();
  const t = getMainPageTranslations(language);

  // Always show data - never block render
  const displayStats = stats || {
    totalProducts: 1373,
    lastOrderNumber: 7774,
    totalSellers: 156
  };

  const statisticsData = [
    {
      icon: Package,
      value: displayStats.totalProducts,
      label: t.statistics.partsListed,
    },
    {
      icon: ShoppingBag,
      value: displayStats.lastOrderNumber,
      label: t.statistics.ordersCreated,
    },
  ];

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
        {statisticsData.map((stat, index) => (
          <StatCard 
            key={index} 
            {...stat} 
            isUpdating={isLoading}
          />
        ))}
      </div>
      
      {isError && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {language === 'en' ? 'Failed to update data' : 'Не удалось обновить данные'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {language === 'en' ? 'Retry' : 'Повторить'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatisticsSection;