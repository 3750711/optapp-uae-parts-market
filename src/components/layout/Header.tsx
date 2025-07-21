
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User, ShoppingCart, Store, Plus, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { MobileProfileMenu } from './MobileProfileMenu';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PB</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              PartsBay
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-primary' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Главная
            </Link>
            
            <Link
              to="/stores"
              className={`text-sm font-medium transition-colors ${
                isActive('/stores') 
                  ? 'text-primary' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Магазины
            </Link>
            
            <Link
              to="/requests"
              className={`text-sm font-medium transition-colors ${
                isActive('/requests') 
                  ? 'text-primary' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Запросы
            </Link>

            {user && (
              <>
                {profile?.user_type === 'buyer' && (
                  <Link
                    to="/buyer/price-offers"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActive('/buyer/price-offers') 
                        ? 'text-primary' 
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Торги</span>
                  </Link>
                )}
                
                <Link
                  to="/orders"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive('/orders') 
                      ? 'text-primary' 
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Заказы</span>
                </Link>

                {profile?.user_type === 'seller' && (
                  <Link
                    to="/seller/price-offers"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActive('/seller/price-offers') 
                        ? 'text-primary' 
                        : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Предложения</span>
                  </Link>
                )}
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Профиль</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Войти
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white pb-4">
            <nav className="flex flex-col space-y-4 pt-4">
              <Link
                to="/"
                className={`text-base font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Главная
              </Link>
              
              <Link
                to="/stores"
                className={`text-base font-medium transition-colors ${
                  isActive('/stores') 
                    ? 'text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Магазины
              </Link>
              
              <Link
                to="/requests"
                className={`text-base font-medium transition-colors ${
                  isActive('/requests') 
                    ? 'text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Запросы
              </Link>

              {user && (
                <>
                  {profile?.user_type === 'buyer' && (
                    <Link
                      to="/buyer/price-offers"
                      className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                        isActive('/buyer/price-offers') 
                          ? 'text-primary' 
                          : 'text-gray-700 hover:text-primary'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Gavel className="w-4 h-4" />
                      <span>Торги</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/orders"
                    className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                      isActive('/orders') 
                        ? 'text-primary' 
                        : 'text-gray-700 hover:text-primary'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Заказы</span>
                  </Link>

                  {profile?.user_type === 'seller' && (
                    <Link
                      to="/seller/price-offers"
                      className={`flex items-center space-x-2 text-base font-medium transition-colors ${
                        isActive('/seller/price-offers') 
                          ? 'text-primary' 
                          : 'text-gray-700 hover:text-primary'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Gavel className="w-4 h-4" />
                      <span>Предложения</span>
                    </Link>
                  )}
                </>
              )}

              {user ? (
                <MobileProfileMenu onClose={() => setIsMenuOpen(false)} />
              ) : (
                <div className="flex flex-col space-y-2 pt-4">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Войти
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
