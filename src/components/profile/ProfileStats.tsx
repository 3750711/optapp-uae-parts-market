
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package, Star, Clock, TrendingUp, MessageCircle } from 'lucide-react';
import { ProfileType } from './types';

interface ProfileStatsProps {
  profile: ProfileType;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
  const isSeller = profile.user_type === 'seller';
  
  // Получаем статистику заказов для текущего пользователя
  const { data: orderStats } = useQuery({
    queryKey: ['user-orders', profile.id],
    queryFn: async () => {
      const [buyerOrdersData, sellerOrdersData] = await Promise.all([
        // Заказы как покупатель
        supabase
          .from('orders')
          .select('status, created_at')
          .eq('buyer_id', profile.id),
        
        // Заказы как продавец (если применимо)
        isSeller ? supabase
          .from('orders')
          .select('status, created_at')
          .eq('seller_id', profile.id) : Promise.resolve({ data: [], error: null })
      ]);

      if (buyerOrdersData.error) throw buyerOrdersData.error;
      if (sellerOrdersData.error) throw sellerOrdersData.error;

      const buyerOrders = buyerOrdersData.data || [];
      const sellerOrders = sellerOrdersData.data || [];
      const allOrders = [...buyerOrders, ...sellerOrders];

      return {
        totalOrders: allOrders.length,
        completedOrders: allOrders.filter(o => o.status === 'completed').length,
        pendingOrders: allOrders.filter(o => ['created', 'confirmed'].includes(o.status)).length
      };
    },
    enabled: !!profile.id,
  });
  
  const stats = [
    {
      title: 'Активные объявления',
      value: profile.listing_count || 0,
      icon: <Package className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      visible: isSeller
    },
    {
      title: 'Всего заказов',
      value: orderStats?.totalOrders || 0,
      icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      visible: true
    },
    {
      title: 'Рейтинг',
      value: profile.rating ? `${profile.rating.toFixed(1)}/5` : 'Нет оценок',
      icon: <Star className="h-5 w-5 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200',
      visible: isSeller
    },
    {
      title: 'Дней на платформе',
      value: profile.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      visible: true
    }
  ];

  const visibleStats = stats.filter(stat => stat.visible);

  const handleContactAdmin = () => {
    window.open('https://t.me/Nastya_PostingLots_OptCargo', '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-optapp-yellow" />
            <CardTitle className="text-lg font-semibold">Статистика профиля</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContactAdmin}
            className="text-optapp-yellow hover:text-optapp-dark transition-colors"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Связаться с админом
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
};

export default ProfileStats;
