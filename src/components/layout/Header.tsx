
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { User, LogOut, Package, ShoppingCart, Plus, Settings, LayoutDashboard, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getUserTypeLabel = (type: string | undefined) => {
    return type === 'seller' ? 'Продавец' : 'Покупатель';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы"
      });
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive"
      });
    }
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col md:flex-row items-center gap-2 md:gap-5">
      <Link 
        to="/" 
        className="font-medium px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
        onClick={onClick}
      >
        Главная
      </Link>
      <Link 
        to="/catalog" 
        className="font-medium px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
        onClick={onClick}
      >
        Каталог
      </Link>
      <Link 
        to="/about" 
        className="font-medium px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground hover:text-primary transition-colors"
        onClick={onClick}
      >
        О нас
      </Link>      
      {/* Контакты убраны из верхнего меню */}
      {profile?.user_type === 'seller' && (
        <Link to="/seller/dashboard" onClick={onClick} className="ml-0 md:ml-2">
          <Button variant="secondary" size="sm" className="animate-float">
            Панель продавца
          </Button>
        </Link>
      )}
    </nav>
  );

  const ordersLink = profile?.user_type === 'seller' ? '/seller/orders' : '/orders';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between py-3 md:py-4 px-4 md:px-8 mx-auto">
        <Link 
          to="/" 
          className="text-2xl font-extrabold tracking-tight flex flex-col items-start gap-0"
        >
          <span className="text-primary">OPT</span>
          <span className="text-secondary">APP</span>
        </Link>

        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-r border-gray-200 shadow-2xl w-[82vw]">
              <div className="flex flex-col space-y-6 py-6">
                <NavLinks onClick={() => setIsMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <NavLinks />
        )}

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              {profile?.user_type && !isMobile && (
                <Badge variant="outline" className="hidden sm:flex bg-accent text-primary border border-primary/20"> 
                  {getUserTypeLabel(profile.user_type)}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative rounded-full h-10 w-10 p-0 text-primary bg-accent/50 border border-primary/20 transition-transform hover:scale-110"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={profile?.avatar_url || ''} 
                        alt={profile?.full_name || 'User'} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white text-foreground shadow-elevation border border-gray-200 rounded-lg animate-scale-in">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span>{profile?.full_name || user.email}</span>
                    {profile?.user_type && (
                      <Badge variant="outline" className="w-fit bg-accent text-primary border border-primary/20">
                        {getUserTypeLabel(profile.user_type)}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                      <Link to="/admin" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Панель администратора</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                    <Link to="/profile" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Мой профиль</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {profile?.user_type === 'seller' && (
                    <>
                      <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link to="/seller/dashboard" className="flex w-full items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Личный кабинет</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link to="/seller/add-product" className="flex w-full items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>Добавить товар</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link to="/seller/create-order" className="flex w-full items-center">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Создать заказ</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                    <Link to={ordersLink} className="flex w-full items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Мои заказы</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                    <Link to="/catalog" className="flex w-full items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Каталог</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                asChild 
                variant="ghost"
                className="text-foreground hover:text-primary"
              >
                <Link to="/login">Вход</Link>
              </Button>
              <Button asChild variant="default">
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
