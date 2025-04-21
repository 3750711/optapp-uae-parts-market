
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
  SheetClose
} from "@/components/ui/sheet";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserTypeLabel = (type: string | undefined) => {
    return type === 'seller' ? 'Продавец' : 'Покупатель';
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link 
        to="/" 
        className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:scale-105 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-black after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
        onClick={onClick}
      >
        Главная
      </Link>
      <Link 
        to="/catalog" 
        className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:scale-105 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-black after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
        onClick={onClick}
      >
        Каталог
      </Link>
      <Link 
        to="/about" 
        className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:scale-105 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-black after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
        onClick={onClick}
      >
        О нас
      </Link>
      <Link 
        to="/contact" 
        className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:scale-105 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-[-4px] after:left-0 after:bg-black after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
        onClick={onClick}
      >
        Контакты
      </Link>
      {profile?.user_type === 'seller' && (
        <Link to="/seller/dashboard" onClick={onClick}>
          <Button 
            variant="default" 
            className="bg-black text-[#f3f414] hover:bg-gray-900 transition-all duration-300 transform hover:scale-105"
          >
            Панель продавца
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <header className="bg-[#f3f414] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-2xl font-extrabold tracking-tight drop-shadow-md transition-transform duration-300 hover:scale-110" 
            style={{ color: "#000" }}
          >
            OPTAPP
          </Link>

          {/* Mobile menu */}
          {isMobile ? (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden p-1">
                  <Menu className="h-6 w-6 text-black" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#f3f414] border-r border-black w-[75%]">
                <div className="flex flex-col space-y-6 py-6">
                  <NavLinks onClick={() => setIsMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            user && (
              <nav className="hidden md:flex items-center space-x-6">
                <NavLinks />
              </nav>
            )
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                {profile?.user_type && !isMobile && (
                  <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="hidden sm:flex bg-[#f3f414] text-black border border-black">
                    {getUserTypeLabel(profile.user_type)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative rounded-full h-10 w-10 p-0 text-black bg-[#f3f414] hover:bg-[#f3f414]/90 border border-black transition-transform hover:scale-110"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={profile?.avatar_url || ''} 
                          alt={profile?.full_name || 'User'} 
                        />
                        <AvatarFallback className="bg-black text-[#f3f414]">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white text-black shadow-lg border border-gray-200 rounded-lg animate-scale-in">
                    <DropdownMenuLabel>
                      {profile?.full_name || user.email}
                      {profile?.user_type && (
                        <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="ml-2 bg-[#f3f414] text-black">
                          {getUserTypeLabel(profile.user_type)}
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Панель администратора</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Мой профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {profile?.user_type === 'seller' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/dashboard" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                            <User className="mr-2 h-4 w-4" />
                            <span>Личный кабинет</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/add-product" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Добавить товар</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/create-order" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Создать заказ</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Мои заказы</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/catalog" className="flex w-full items-center text-black hover:bg-gray-100 transition-colors duration-300">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Каталог</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500 hover:bg-red-50 transition-colors duration-300">
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
                  className="text-black hover:bg-black/10 transition-all duration-300 hover:scale-105"
                >
                  <Link to="/login">Вход</Link>
                </Button>
                <Button 
                  asChild
                  className="bg-black text-[#f3f414] hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                >
                  <Link to="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
