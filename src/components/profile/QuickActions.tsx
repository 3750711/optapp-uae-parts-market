
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  Settings, 
  Store, 
  QrCode,
  MessageCircle,
  FileText
} from 'lucide-react';
import { ProfileType } from './types';

interface QuickActionsProps {
  profile: ProfileType;
}

const QuickActions: React.FC<QuickActionsProps> = ({ profile }) => {
  const navigate = useNavigate();
  const isSeller = profile.user_type === 'seller';

  const actions = [
    {
      title: 'Мои заказы',
      description: 'Просмотр заказов',
      icon: <ShoppingBag className="h-5 w-5" />,
      onClick: () => navigate('/buyer/orders'),
      color: 'bg-blue-500 hover:bg-blue-600',
      visible: true
    },
    {
      title: 'Мои объявления',
      description: 'Управление товарами',
      icon: <Package className="h-5 w-5" />,
      onClick: () => navigate('/seller/listings'),
      color: 'bg-green-500 hover:bg-green-600',
      visible: isSeller
    },
    {
      title: 'Добавить товар',
      description: 'Создать объявление',
      icon: <Plus className="h-5 w-5" />,
      onClick: () => navigate('/seller/add-product'),
      color: 'bg-purple-500 hover:bg-purple-600',
      visible: isSeller
    },
    {
      title: 'Мой магазин',
      description: 'Управление магазином',
      icon: <Store className="h-5 w-5" />,
      onClick: () => navigate('/create-store'),
      color: 'bg-orange-500 hover:bg-orange-600',
      visible: isSeller
    },
    {
      title: 'Создать запрос',
      description: 'Найти запчасти',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => navigate('/create-request'),
      color: 'bg-teal-500 hover:bg-teal-600',
      visible: !isSeller
    },
    {
      title: 'Настройки',
      description: 'Настройки аккаунта',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => {}, // Will implement settings later
      color: 'bg-gray-500 hover:bg-gray-600',
      visible: true
    }
  ];

  const visibleActions = actions.filter(action => action.visible);

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-optapp-yellow" />
          <CardTitle className="text-lg font-semibold">Быстрые действия</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200`}
            >
              {action.icon}
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
