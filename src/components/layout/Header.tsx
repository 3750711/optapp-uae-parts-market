
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Package, ShoppingCart, Plus, Settings, LayoutDashboard, Menu, Store, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'admin':
        return 'Администратор';
      case 'seller':
        return 'Продавец';
      case 'buyer':
        return 'Покупатель';
      default:
        return 'Пользователь';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Вы вышли из системы",
        description: "До встречи!",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Ошибка выхода",
        description: "Произошла ошибка при выходе из системы",
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.user_type === 'admin';

  const MenuItems = () => (
    <>
      {user && (
        <>
          <Link to="/profile" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
            <User className="h-4 w-4" />
            <span>Профиль</span>
          </Link>
          
          {profile?.user_type === 'seller' && (
            <>
              <Link to="/seller/products" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                <Package className="h-4 w-4" />
                <span>Мои товары</span>
              </Link>
              <Link to="/seller/add-product" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                <Plus className="h-4 w-4" />
                <span>Добавить товар</span>
              </Link>
              <Link to="/seller/dashboard" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                <LayoutDashboard className="h-4 w-4" />
                <span>Панель продавца</span>
              </Link>
              <Link to="/seller/store" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                <Store className="h-4 w-4" />
                <span>Мой магазин</span>
              </Link>
            </>
          )}
          
          <Link to="/orders" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
            <ShoppingCart className="h-4 w-4" />
            <span>Заказы</span>
          </Link>
          
          <Link to="/requests" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
            <MessageSquare className="h-4 w-4" />
            <span>Запросы</span>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-red-600">
              <Settings className="h-4 w-4" />
              <span>Админка</span>
            </Link>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/d29c93b7-de66-4cd7-a8c4-ead3a0e2a872.png" 
                alt="OPT Cargo" 
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-bold text-gray-900">OPT Cargo</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-4">
            <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Главная
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Товары
            </Link>
            <Link to="/stores" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Магазины
            </Link>
            <Link to="/requests" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Запросы
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                {isMobile ? (
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <div className="flex flex-col space-y-4 mt-8">
                        <div className="flex items-center space-x-3 pb-4 border-b">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile?.full_name || 'Пользователь'}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {getUserTypeLabel(profile?.user_type || '')}
                              </Badge>
                              {profile?.opt_id && (
                                <span className="text-xs text-gray-500">
                                  ID: {profile.opt_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <MenuItems />
                        <Button 
                          onClick={handleSignOut}
                          variant="ghost" 
                          className="justify-start p-2 text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Выйти
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.full_name || 'Пользователь'}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getUserTypeLabel(profile?.user_type || '')}
                            </Badge>
                            {profile?.opt_id && (
                              <span className="text-xs text-muted-foreground">
                                ID: {profile.opt_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Профиль</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {profile?.user_type === 'seller' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/seller/products" className="cursor-pointer">
                              <Package className="mr-2 h-4 w-4" />
                              <span>Мои товары</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/seller/add-product" className="cursor-pointer">
                              <Plus className="mr-2 h-4 w-4" />
                              <span>Добавить товар</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/seller/dashboard" className="cursor-pointer">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Панель продавца</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/seller/store" className="cursor-pointer">
                              <Store className="mr-2 h-4 w-4" />
                              <span>Мой магазин</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Заказы</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/requests" className="cursor-pointer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Запросы</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer text-red-600">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Админка</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
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
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Вход</Button>
                </Link>
                <Link to="/register">
                  <Button>Регистрация</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
