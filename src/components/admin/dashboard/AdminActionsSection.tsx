
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Store,
  Image,
  Settings
} from 'lucide-react';

const AdminActionsSection: React.FC = () => {
  const actions = [
    {
      title: 'Управление пользователями',
      description: 'Просмотр и редактирование профилей пользователей',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600'
    },
    {
      title: 'Управление товарами',
      description: 'Модерация и редактирование товаров',
      icon: Package,
      href: '/admin/products',
      color: 'text-green-600'
    },
    {
      title: 'Управление заказами',
      description: 'Просмотр и обработка заказов',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'text-purple-600'
    },
    {
      title: 'Управление магазинами',
      description: 'Просмотр и редактирование магазинов',
      icon: Store,
      href: '/admin/stores',
      color: 'text-orange-600'
    },
    {
      title: 'Оптимизация изображений',
      description: 'Создание превью для изображений товаров',
      icon: Image,
      href: '/admin/image-optimizer',
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Card key={action.href} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <IconComponent className={`h-6 w-6 ${action.color}`} />
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </div>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to={action.href}>Перейти</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminActionsSection;
