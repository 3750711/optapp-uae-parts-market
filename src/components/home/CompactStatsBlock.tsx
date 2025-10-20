import React from 'react';
import { Package, ShoppingBag } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { AutomotiveCard } from '@/components/ui/automotive-card';

interface CompactStatsBlockProps {
  language?: 'ru' | 'en' | 'bn';
}

export const CompactStatsBlock: React.FC<CompactStatsBlockProps> = ({ language = 'ru' }) => {
  const { data: stats, isLoading } = useStatistics();

  if (isLoading) {
    return (
      <AutomotiveCard className="max-w-md mx-auto animate-pulse">
        <div className="flex items-center justify-around p-6">
          <div className="h-20 w-32 bg-muted rounded"></div>
          <div className="h-12 w-px bg-border"></div>
          <div className="h-20 w-32 bg-muted rounded"></div>
        </div>
      </AutomotiveCard>
    );
  }

  return (
    <AutomotiveCard 
      metallic 
      glowing 
      className="max-w-md mx-auto transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-center justify-around p-6">
        {/* Parts Statistics */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {stats?.totalProducts?.toLocaleString() || '1373'}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Автозапчастей
          </p>
        </div>
        
        {/* Vertical Divider */}
        <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
        
        {/* Orders Statistics */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {stats?.lastOrderNumber?.toLocaleString() || '7774'}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Заказов создано
          </p>
        </div>
      </div>
    </AutomotiveCard>
  );
};
