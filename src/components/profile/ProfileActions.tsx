
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { LogOut, Settings, User, Package } from 'lucide-react';

export const ProfileActions: React.FC = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavigateToProducts = () => {
    navigate('/seller/dashboard');
  };

  const handleNavigateToOrders = () => {
    navigate('/orders');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Действия
        </CardTitle>
        <CardDescription>
          Управление аккаунтом и навигация
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleNavigateToProducts} 
          variant="outline" 
          className="w-full justify-start"
        >
          <Package className="mr-2 h-4 w-4" />
          Мои товары
        </Button>
        
        <Button 
          onClick={handleNavigateToOrders} 
          variant="outline" 
          className="w-full justify-start"
        >
          <User className="mr-2 h-4 w-4" />
          Мои заказы
        </Button>
        
        <Button 
          onClick={handleSignOut} 
          variant="destructive" 
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти из аккаунта
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileActions;
