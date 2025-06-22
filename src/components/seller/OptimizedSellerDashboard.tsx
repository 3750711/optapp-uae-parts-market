
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Package, Plus, BarChart3, TrendingUp } from 'lucide-react';

export const OptimizedSellerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Активные товары', value: '12', icon: Package, color: 'text-blue-600' },
    { label: 'Заказы за месяц', value: '8', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Просмотры', value: '245', icon: BarChart3, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Панель продавца</h1>
          <p className="text-gray-600">Добро пожаловать, {profile?.full_name}</p>
        </div>
        <Button onClick={() => navigate('/products/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Товар "iPhone 14" просмотрен</p>
                <p className="text-sm text-gray-500">2 часа назад</p>
              </div>
              <Badge variant="secondary">Просмотр</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Новый заказ на "MacBook Pro"</p>
                <p className="text-sm text-gray-500">5 часов назад</p>
              </div>
              <Badge>Заказ</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Товар "iPad Air" обновлен</p>
                <p className="text-sm text-gray-500">1 день назад</p>
              </div>
              <Badge variant="outline">Обновление</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedSellerDashboard;
