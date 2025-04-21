
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
    <header className="bg-[#f3f414] shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold tracking-tight drop-shadow-md" style={{ color: "#000" }}>
            OPTAPP
          </Link>

          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-black hover:text-[#f3f414] font-medium transition-colors">
                Главная
              </Link>
              <Link to="/catalog" className="text-black hover:text-[#f3f414] font-medium transition-colors">
                Каталог
              </Link>
              <Link to="/about" className="text-black hover:text-[#f3f414] font-medium transition-colors">
                О нас
              </Link>
              <Link to="/contact" className="text-black hover:text-[#f3f414] font-medium transition-colors">
                Контакты
              </Link>
              {/* Админ панель убрана навсегда */}
              {profile?.user_type === 'seller' && (
                <Link to="/seller/dashboard">
                  <Button variant="default" className="bg-black text-[#f3f414] hover:bg-gray-900">
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
                  <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="hidden sm:flex bg-[#f3f414] text-black">
                    {getUserTypeLabel(profile.user_type)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0 text-black bg-[#f3f414] hover:bg-[#f3f414]/90 border border-black">
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
                  <DropdownMenuContent align="end" className="w-56 bg-white text-black shadow border border-[#f3f414]">
                    <DropdownMenuLabel>
                      {profile?.full_name || user.email}
                      {profile?.user_type && (
                        <Badge variant={profile.user_type === 'seller' ? 'default' : 'secondary'} className="ml-2 bg-[#f3f414] text-black">
                          {getUserTypeLabel(profile.user_type)}
                        </Badge>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Кнопка панели администратора только в выпадающем меню — на случай, если нужно */}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Панель администратора</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Мой профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {profile?.user_type === 'seller' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/dashboard" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                            <User className="mr-2 h-4 w-4" />
                            <span>Личный кабинет</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/add-product" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Добавить товар</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/seller/create-order" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Создать заказ</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Мои заказы</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/catalog" className="flex w-full items-center text-black hover:bg-[#f3f414]/30">
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
                  className="bg-black text-[#f3f414] hover:bg-gray-900"
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
