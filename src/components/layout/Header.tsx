
import React, { useState } from "react";
import { Link } from "react-router-dom";
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

  const getUserTypeLabel = (type: string | undefined) => {
    return type === 'seller' ? 'Продавец' : 'Покупатель';
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
      <Link 
        to="/" 
        className="text-link font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition"
        onClick={onClick}
      >
        Главная
      </Link>
      <Link 
        to="/catalog" 
        className="text-link font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition"
        onClick={onClick}
      >
        Каталог
      </Link>
      <Link 
        to="/about" 
        className="text-link font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition"
        onClick={onClick}
      >
        О нас
      </Link>
      <Link 
        to="/contact" 
        className="text-link font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition"
        onClick={onClick}
      >
        Контакты
      </Link>
      {profile?.user_type === 'seller' && (
        <Link to="/seller/dashboard" onClick={onClick} className="ml-0 md:ml-1">
          <button className="btn-accent px-5 py-2 text-[14px] font-bold animate__animated animate__fadeInUp">
            Панель продавца
          </button>
        </Link>
      )}
    </nav>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-[#e2e7f0]">
      <div className="container flex items-center justify-between py-3 md:py-5">
        <Link 
          to="/" 
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "#2269f1" }}
        >
          OPTAPP
        </Link>

        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-1">
                <Menu className="h-7 w-7 text-black" />
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

        <div className="flex items-center space-x-2">
          {user ? (
            <div className="flex items-center space-x-2">
              {profile?.user_type && !isMobile && (
                <Badge variant="secondary" className="hidden sm:flex bg-[#fffbe5] text-[#424b5a] border border-[#e4bc1b] shadow"> 
                  {getUserTypeLabel(profile.user_type)}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative rounded-full h-10 w-10 p-0 text-black bg-[#fffbe5] border border-[#fbe87d] shadow transition-transform hover:scale-110"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={profile?.avatar_url || ''} 
                        alt={profile?.full_name || 'User'} 
                      />
                      <AvatarFallback className="bg-[#ffe158] text-black">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white text-black shadow-lg border border-gray-200 rounded-xl animate-scale-in">
                  <DropdownMenuLabel>
                    {profile?.full_name || user.email}
                    {profile?.user_type && (
                      <Badge variant="secondary" className="ml-2 bg-[#fffbe5] text-[#424b5a] border border-[#e4bc1b] shadow">
                        {getUserTypeLabel(profile.user_type)}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Панель администратора</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Мой профиль</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {profile?.user_type === 'seller' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/seller/dashboard" className="flex w-full items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Личный кабинет</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/seller/add-product" className="flex w-full items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          <span>Добавить товар</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/seller/create-order" className="flex w-full items-center">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Создать заказ</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex w-full items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Мои заказы</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/catalog" className="flex w-full items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Каталог</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-500 hover:bg-red-50">
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
                className="text-[#181920] hover:bg-[#f6f7fa] transition-all duration-200 border border-gray-200"
              >
                <Link to="/login">Вход</Link>
              </Button>
              <Button 
                asChild
                className="btn-accent hover:bg-yellow-300 transition-all duration-200"
              >
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
