
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, ShoppingCart, Store, Plus, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface MobileProfileMenuProps {
  onClose: () => void;
}

export const MobileProfileMenu: React.FC<MobileProfileMenuProps> = ({ onClose }) => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {profile?.full_name || 'Пользователь'}
          </p>
          <p className="text-sm text-gray-500">
            {profile?.user_type === 'buyer' ? 'Покупатель' : 'Продавец'}
          </p>
        </div>
      </div>

      <nav className="space-y-2">
        <Link
          to="/profile"
          className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
          onClick={onClose}
        >
          <User className="w-4 h-4" />
          <span>Профиль</span>
        </Link>

        <Link
          to="/orders"
          className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
          onClick={onClose}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Заказы</span>
        </Link>

        {profile?.user_type === 'buyer' && (
          <Link
            to="/buyer/price-offers"
            className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            onClick={onClose}
          >
            <Gavel className="w-4 h-4" />
            <span>Торги</span>
          </Link>
        )}

        {profile?.user_type === 'seller' && (
          <>
            <Link
              to="/seller/price-offers"
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={onClose}
            >
              <Gavel className="w-4 h-4" />
              <span>Предложения</span>
            </Link>
            <Link
              to="/create-store"
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={onClose}
            >
              <Store className="w-4 h-4" />
              <span>Создать магазин</span>
            </Link>
          </>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </nav>
    </div>
  );
};
