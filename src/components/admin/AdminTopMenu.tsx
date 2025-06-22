
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Store,
  BarChart3,
  LogOut,
  Home
} from 'lucide-react';

const AdminTopMenu = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: BarChart3, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Пользователи' },
    { path: '/admin/products', icon: Package, label: 'Товары' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Заказы' },
    { path: '/admin/stores', icon: Store, label: 'Магазины' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span className="font-semibold">OptApp Admin</span>
          </Link>
          
          <div className="flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-optapp-yellow text-optapp-dark'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AdminTopMenu;
