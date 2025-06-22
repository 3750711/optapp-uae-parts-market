import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Link } from 'react-router-dom';
import { ArrowUpRight, PackageCheck, ShoppingBag, Users } from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Общая статистика</CardTitle>
          <CardDescription>Обзор вашего бизнеса</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">1,250</div>
          <p className="text-muted-foreground">Всего продаж</p>
        </CardContent>
      </Card>

      {/* Последние заказы */}
      <Card>
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
          <CardDescription>Недавние транзакции</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">5</div>
          <p className="text-muted-foreground">Новых заказов</p>
        </CardContent>
      </Card>

      {/* Продукты */}
      <Card>
        <CardHeader>
          <CardTitle>Продукты</CardTitle>
          <CardDescription>Управление вашими товарами</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">50</div>
          <p className="text-muted-foreground">Всего товаров</p>
        </CardContent>
      </Card>

      {/* Ссылки на разделы */}
      <Card>
        <CardHeader>
          <CardTitle>Разделы</CardTitle>
          <CardDescription>Быстрый доступ</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <Button asChild variant="outline">
            <Link to="/seller/listings" className="flex items-center justify-between w-full">
              <span>Мои товары</span>
              <ShoppingBag className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/seller/orders" className="flex items-center justify-between w-full">
              <span>Заказы</span>
              <PackageCheck className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/seller/add-product" className="flex items-center justify-between w-full">
              <span>Добавить товар</span>
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboard;
