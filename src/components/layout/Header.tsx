
import React from "react";
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
import { User, LogOut, Package, ShoppingCart, Plus, Settings, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserTypeLabel = (type: string | undefined) => {
    return type === 'seller' ? 'Продавец' : 'Покупатель';
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold" style={{ color: "#000" }}>
            OPTAPP
          </Link>

          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:text-black">
                Главная
              </Link>
              <Link to="/catalog" className="hover:text-black">
                Каталог
              </Link>
              <Link to="/about" className="hover:text-black">
                О нас
              </Link>
              <Link to="/contact" className="hover:text-black">
                Контакты
              </Link>
              
              {/* Убираем кнопку Админ панель для всех, не рендерим её совсем */}
              {/* Показ кнопки админ панели убран */}
              
              {profile?.user_type === 'seller' && (
                <Link to="/seller/dashboard">
                  <Button variant="default" className="bg-black text-primary hover:bg-gray-900">
                    Панель продавца
                  </Button>
                </Link>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                {profile?.user_type && (
                  <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="hidden sm:flex">
                    {getUserTypeLabel(profile.user_type)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0 text-black">
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
                  <DropdownMenuContent align="end" className="w-56 bg-white text-black">
                    <DropdownMenuLabel>
                      {profile?.full_name || user.email}
                      {profile?.user_type && (
                        <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="ml-2">
                          {getUserTypeLabel(profile.user_type)}
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex w-full items-center text-black hover:bg-gray-100">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Панель администратора</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex w-full items-center text-black hover:bg-gray-100">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Мой профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {profile?.user_type === 'seller' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/dashboard" className="flex w-full items-center text-black hover:bg-gray-100">
                            <User className="mr-2 h-4 w-4" />
                            <span>Личный кабинет</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/add-product" className="flex w-full items-center text-black hover:bg-gray-100">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Добавить товар</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/create-order" className="flex w-full items-center text-black hover:bg-gray-100">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Создать заказ</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex w-full items-center text-black hover:bg-gray-100">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Мои заказы</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/catalog" className="flex w-full items-center text-black hover:bg-gray-100">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Каталог</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
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
                  className="text-black"
                >
                  <Link to="/login">Вход</Link>
                </Button>
                <Button 
                  asChild
                  className="bg-black text-primary hover:bg-gray-900"
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

