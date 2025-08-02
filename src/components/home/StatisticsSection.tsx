import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, Users, Building2 } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  gradient: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, gradient, delay }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const start = Date.now();
      const startValue = 0;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOut cubic
        
        setDisplayValue(Math.floor(startValue + (value - startValue) * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className={`group relative overflow-hidden rounded-2xl p-6 ${gradient} hover-lift animate-fade-in-scale`}
         style={{ animationDelay: `${delay}ms` }}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {displayValue.toLocaleString()}+
            </div>
          </div>
        </div>
        
        <p className="text-white/90 font-medium leading-relaxed">
          {label}
        </p>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

const StatisticsSection: React.FC = () => {
  const { data: stats, isLoading } = useStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const statisticsData = [
    {
      icon: Package,
      value: stats?.totalProducts || 908,
      label: "Размещенных лотов",
      gradient: "bg-gradient-primary",
      delay: 0,
    },
    {
      icon: ShoppingBag,
      value: stats?.totalOrders || 156,
      label: "Оформленных заказов",
      gradient: "bg-gradient-secondary",
      delay: 150,
    },
    {
      icon: Users,
      value: stats?.totalSellers || 27,
      label: "Проверенных продавцов",
      gradient: "bg-gradient-success",
      delay: 300,
    },
    {
      icon: Building2,
      value: 1,
      label: "Профессиональное закрытое сообщество",
      gradient: "bg-gradient-info",
      delay: 450,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statisticsData.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatisticsSection;