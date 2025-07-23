import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Plus, 
  Store, 
  MessageSquare, 
  Calendar,
  Truck,
  Car
} from 'lucide-react';

export const QuickActionsSection = () => {
  const navigate = useNavigate();

  const mainActions = [
    {
      title: 'Управление пользователями',
      description: 'Проверка и управление пользователями',
      icon: Users,
      path: '/admin/users'
    },
    {
      title: 'Управление товарами',
      description: 'Проверка и управление товарами',
      icon: Package,
      path: '/admin/products'
    },
    {
      title: 'Управление заказами',
      description: 'Просмотр и управление заказами',
      icon: ShoppingCart,
      path: '/admin/orders'
    }
  ];

  const additionalActions = [
    {
      title: 'Добавить товар',
      description: 'Создать новый товар',
      icon: Plus,
      path: '/admin/add-product'
    },
    {
      title: 'Магазины',
      description: 'Управление магазинами',
      icon: Store,
      path: '/admin/stores'
    },
    {
      title: 'Сообщения',
      description: 'Просмотр сообщений',
      icon: MessageSquare,
      path: '/admin/messages'
    },
    {
      title: 'События',
      description: 'Управление событиями',
      icon: Calendar,
      path: '/admin/events'
    },
    {
      title: 'Логистика',
      description: 'Управление логистикой',
      icon: Truck,
      path: '/admin/logistics'
    },
    {
      title: 'Каталог авто',
      description: 'Управление каталогом',
      icon: Car,
      path: '/admin/car-catalog'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Основные функции</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card key={action.path}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(action.path)}
                    className="w-full"
                  >
                    Открыть
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Дополнительные инструменты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {additionalActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card key={action.path}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(action.path)}
                    className="w-full"
                    variant="outline"
                  >
                    Открыть
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsSection;