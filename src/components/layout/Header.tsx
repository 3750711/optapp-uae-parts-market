
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Store, 
  FileText, 
  Package, 
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Heart,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { 
      path: '/catalog', 
      label: 'Каталог', 
      icon: Package,
      description: 'Автозапчасти'
    },
    { 
      path: '/stores', 
      label: 'Магазины', 
      icon: Store,
      description: 'Поставщики'
    },
    { 
      path: '/requests', 
      label: 'Запросы', 
      icon: FileText,
      description: 'Заявки'
    },
    { 
      path: '/orders', 
      label: 'Заказы', 
      icon: ShoppingCart,
      description: 'Мои заказы'
    }
  ];

  // Navigation items for unauthenticated users
  const publicNavItems = [
    { path: '/about', label: 'О нас' },
    { path: '/contact', label: 'Контакты' }
  ];

  const navItems = user ? authenticatedNavItems : publicNavItems;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-optapp-yellow rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">PartsBay.ae</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-optapp-yellow/10 text-optapp-yellow'
                    : 'text-gray-600 hover:text-optapp-yellow hover:bg-optapp-yellow/5'
                }`}
              >
                {'icon' in item && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  asChild
                >
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                    {notifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {notifications}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Favorites */}
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <Link to="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                        <AvatarFallback className="bg-optapp-yellow text-white">
                          {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || 'Пользователь'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Auth buttons for unauthenticated users */}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Войти
                  </Link>
                </Button>
                <Button size="sm" className="bg-optapp-yellow hover:bg-optapp-yellow/90" asChild>
                  <Link to="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Регистрация
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-optapp-yellow/10 text-optapp-yellow'
                          : 'text-gray-600 hover:text-optapp-yellow hover:bg-optapp-yellow/5'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {'icon' in item && <item.icon className="h-5 w-5" />}
                      <div className="flex flex-col">
                        <span className="font-medium">{item.label}</span>
                        {'description' in item && (
                          <span className="text-xs text-gray-500">{item.description}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                  
                  {!user && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        asChild
                      >
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
                          Войти
                        </Link>
                      </Button>
                      <Button 
                        className="w-full justify-start bg-optapp-yellow hover:bg-optapp-yellow/90" 
                        asChild
                      >
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Регистрация
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
