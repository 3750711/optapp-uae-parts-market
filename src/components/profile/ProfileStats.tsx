
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Star, Clock, TrendingUp } from 'lucide-react';
import { ProfileType } from './types';

interface ProfileStatsProps {
  profile: ProfileType;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
  const isSeller = profile.user_type === 'seller';
  
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
      value: 0, // Will be implemented later with actual data
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

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-optapp-yellow" />
          <CardTitle className="text-lg font-semibold">Статистика профиля</CardTitle>
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
