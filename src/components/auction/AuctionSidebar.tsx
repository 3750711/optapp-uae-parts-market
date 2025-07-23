
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Bell, 
  Settings,
  Activity,
  Star,
  Clock,
  TrendingUp
} from 'lucide-react';

interface AuctionSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  offerCounts: {
    active: number;
    cancelled: number;
    completed: number;
    total: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'bid' | 'win' | 'outbid';
    product: string;
    amount: number;
    time: Date;
  }>;
}

export const AuctionSidebar: React.FC<AuctionSidebarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  offerCounts,
  recentActivity
}) => {
  const statusOptions = [
    { value: 'all', label: 'Все торги', count: offerCounts.total },
    { value: 'active', label: 'Активные', count: offerCounts.active },
    { value: 'leading', label: 'Лидирую', count: 0 },
    { value: 'ending', label: 'Заканчиваются', count: 0 },
    { value: 'completed', label: 'Завершенные', count: offerCounts.completed },
  ];

  const sortOptions = [
    { value: 'time', label: 'По времени', icon: Clock },
    { value: 'price', label: 'По цене', icon: TrendingUp },
    { value: 'activity', label: 'По активности', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Статус торгов
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "ghost"}
                className="w-full justify-between text-sm"
                onClick={() => onStatusChange(option.value)}
              >
                <span>{option.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sort Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <SortAsc className="h-4 w-4" />
            Сортировка
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "ghost"}
                className="w-full justify-start text-sm"
                onClick={() => onSortChange(option.value)}
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Последняя активность
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'win' ? 'bg-green-500' :
                  activity.type === 'outbid' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="font-medium line-clamp-1">{activity.product}</div>
                  <div className="text-gray-500 text-xs">
                    ${activity.amount.toLocaleString()} • {activity.time.toLocaleTimeString('ru-RU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Уведомления
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Star className="h-4 w-4 mr-2" />
              Избранное
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
