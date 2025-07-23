
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Activity,
  Trophy,
  Target
} from 'lucide-react';

interface AuctionHeroProps {
  stats: {
    activeAuctions: number;
    totalBids: number;
    totalValue: number;
    userWins: number;
    userActive: number;
    userLeading: number;
  };
  lastUpdateTime?: Date;
}

export const AuctionHero: React.FC<AuctionHeroProps> = ({ 
  stats, 
  lastUpdateTime 
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Торговый зал</h1>
          <p className="text-blue-100">
            Участвуйте в торгах и выигрывайте лучшие предложения
          </p>
        </div>
        
        {lastUpdateTime && (
          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm">
              Live • {lastUpdateTime.toLocaleTimeString('ru-RU')}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">{stats.activeAuctions}</div>
            <div className="text-sm text-blue-100">Активных торгов</div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <div className="text-sm text-blue-100">Всего ставок</div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            <div className="text-sm text-blue-100">Общая стоимость</div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">{stats.userWins}</div>
            <div className="text-sm text-blue-100">Ваши победы</div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">{stats.userActive}</div>
            <div className="text-sm text-blue-100">Ваши активные</div>
          </CardContent>
        </Card>

        <Card className="bg-white/20 border-white/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-white" />
            <div className="text-2xl font-bold">{stats.userLeading}</div>
            <div className="text-sm text-blue-100">Лидируете</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
