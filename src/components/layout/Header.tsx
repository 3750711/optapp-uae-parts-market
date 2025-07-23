
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, ShoppingCart, Bell, Search, Home, Package, Store, MessageSquare, HelpCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const Header = () => {
  const { user, profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Navigation items for authenticated users
  const navigationItems = [
    { href: '/catalog', label: 'Каталог', icon: Package },
    { href: '/stores', label: 'Магазины', icon: Store },
    { href: '/requests', label: 'Запросы', icon: MessageSquare },
    { href: '/buyer-guide', label: 'Покупателю', icon: HelpCircle },
    { href: '/about', label: 'О нас', icon: Home },
    { href: '/contact', label: 'Контакты', icon: Mail },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      isScrolled 
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" 
        : "bg-background"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">PartsBay</span>
          </Link>

          {/* Desktop Navigation - Only for authenticated users */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <NavigationMenu>
                <NavigationMenuList>
                  {navigationItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        asChild
                        className={cn(
                          "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                          isActive(item.href) ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <Link to={item.href}>
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* Right side - User actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Authenticated user actions */}
                <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                  <Link to="/favorites">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                </Button>

                <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                  <Link to="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Mobile menu for authenticated users */}
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Меню</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={closeMenu}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                            isActive(item.href) 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-accent"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      
                      <div className="border-t pt-4">
                        <Link
                          to="/profile"
                          onClick={closeMenu}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent"
                        >
                          <User className="h-5 w-5" />
                          <span>Профиль</span>
                        </Link>
                        <Link
                          to="/notifications"
                          onClick={closeMenu}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent"
                        >
                          <Bell className="h-5 w-5" />
                          <span>Уведомления</span>
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={closeMenu}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          <span>Избранное</span>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          Выйти
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                {/* Unauthenticated user actions */}
                <Button variant="ghost" asChild className="hidden md:flex">
                  <Link to="/login">Войти</Link>
                </Button>
                <Button asChild className="hidden md:flex">
                  <Link to="/register">Зарегистрироваться</Link>
                </Button>

                {/* Mobile menu for unauthenticated users */}
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Меню</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <Button asChild className="w-full" onClick={closeMenu}>
                        <Link to="/login">Войти</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full" onClick={closeMenu}>
                        <Link to="/register">Зарегистрироваться</Link>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
