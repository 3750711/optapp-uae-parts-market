
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Star, Clock, TrendingUp, MessageCircle } from 'lucide-react';
import { ProfileType } from './types';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileTranslations } from '@/utils/profileTranslations';
import { useLanguage } from '@/hooks/useLanguage';

interface OptimizedProfileStatsProps {
  profile: ProfileType;
  orderStats?: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
  } | null;
  isLoading?: boolean;
}

const OptimizedProfileStats: React.FC<OptimizedProfileStatsProps> = memo(({
  profile,
  orderStats,
  isLoading = false
}) => {
  const { language } = useLanguage();
  const isSeller = profile.user_type === 'seller';
  const t = getProfileTranslations(language);

  const handleContactAdmin = () => {
    window.open('https://t.me/Nastya_PostingLots_OptCargo', '_blank');
  };

  const stats = [
    {
      title: t.activeListings,
      value: profile.listing_count || 0,
      icon: <Package className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      visible: isSeller
    },
    {
      title: t.totalOrders,
      value: orderStats?.totalOrders || 0,
      icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      visible: true
    },
    {
      title: t.rating,
      value: profile.rating ? `${profile.rating.toFixed(1)}/5` : t.noRatingsYet,
      icon: <Star className="h-5 w-5 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200',
      visible: isSeller
    },
    {
      title: t.daysOnPlatform,
      value: profile.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
        : 0,
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      visible: true
    }
  ];

  const visibleStats = stats.filter(stat => stat.visible);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-optapp-yellow" />
              <CardTitle className="text-lg font-semibold">{t.profileStats}</CardTitle>
            </div>
            <Skeleton className="h-9 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: isSeller ? 4 : 3 }).map((_, index) => (
              <div key={index} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-optapp-yellow" />
            <CardTitle className="text-lg font-semibold">{t.profileStats}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContactAdmin}
            className="text-optapp-yellow hover:text-optapp-dark transition-colors"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {t.contactAdmin}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {visibleStats.map((stat, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${stat.color} hover:scale-105 transition-transform duration-200`}
            >
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="font-bold text-lg">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedProfileStats.displayName = "OptimizedProfileStats";

export default OptimizedProfileStats;
