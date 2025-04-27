import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Store, Settings } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast()
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Вы вышли из аккаунта",
        description: "До свидания!",
      })
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из аккаунта",
        variant: "destructive",
      })
    }
  };
  
  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'Каталог', href: '/catalog' },
    { name: 'Магазины', href: '/stores' },
    { name: 'О проекте', href: '/about' },
    { name: 'Контакт', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          Your Brand
        </Link>

        <nav className="hidden md:flex space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-gray-600 hover:text-gray-800"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full h-10 w-10 overflow-hidden border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Avatar>
                  <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/ лица /: ${user.id}`} alt={user.full_name || user.email} />
                  <AvatarFallback>{user.full_name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2">
              <DropdownMenuLabel>{user.full_name || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Профиль</span>
              </DropdownMenuItem>
              {user.user_type === 'seller' && (
                <DropdownMenuItem onClick={() => navigate('/seller-profile')}>
                  <Store className="mr-2 h-4 w-4" />
                  <span>Личный кабинет</span>
                </DropdownMenuItem>
              )}
              {user.user_type === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Панель администратора</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Выйти</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-x-3">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-800"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
