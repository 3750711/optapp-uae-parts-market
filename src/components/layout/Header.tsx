import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
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
import { 
  User, 
  LogOut, 
  Package, 
  ShoppingCart, 
  Plus, 
  Settings, 
  LayoutDashboard, 
  Menu, 
  Store, 
  MessageSquare,
  Bell,
  Heart,
  HelpCircle,
  ClipboardList,
  ShoppingBag,
  Gavel
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';
import { useFavorites } from '@/hooks/useFavorites';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import LanguageToggle from '@/components/auth/LanguageToggle';
import { useLanguage } from '@/hooks/useLanguage';
import { getMainPageTranslations } from '@/utils/mainPageTranslations';

const Header = () => {
  const { user, signOut, profile, isLoading } = useAuth();
  const { isAdmin, isCheckingAdmin } = useAdminAccess();
  const { unreadCount } = useNotifications();
  const { favorites } = useFavorites();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const t = getMainPageTranslations(language);

  // Отладочная информация для Header
  console.log('🏠 Header Debug:', {
    user_email: user?.email,
    profile_user_type: profile?.user_type,
    isAdmin,
    isCheckingAdmin,
    isLoading
  });

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
      {/* Navigation links removed */}
    </nav>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between py-3 md:py-4 px-4 md:px-8 mx-auto">
        <Link 
          to={(function getHomePath() {
            if (!user || !profile) return "/";
            if (isAdmin) return "/admin";
            const isVerified = profile.verification_status === 'verified';
            if (!isVerified && !isAdmin) return "/pending-approval";
            if (profile.user_type === 'buyer') return "/buyer-dashboard";
            if (profile.user_type === 'seller') return "/seller/dashboard";
            return "/";
          })()}
          className="text-2xl font-extrabold tracking-tight"
        >
          <span className="text-primary">partsbay</span>
          <span className="text-secondary">.ae</span>
        </Link>

        <NavLinks />

        <div className="flex items-center space-x-3">
          {/* Language Toggle - always visible */}
          <LanguageToggle 
            language={language}
            onLanguageChange={changeLanguage}
            className="mr-2"
          />
          
          {user ? (
            <div className="flex items-center space-x-2">
              {/* Show NotificationBell only on desktop */}
              {!isMobile && <NotificationBell />}
              
              {/* Mobile: Link to profile menu page */}
              {isMobile ? (
                <Link to={profile?.user_type === 'seller' ? '/seller/profile-menu' : '/profile-menu'}>
                  <Button 
                    variant="ghost" 
                    className="relative rounded-full h-10 w-10 p-0 text-primary bg-accent/50 border border-primary/20 transition-transform hover:scale-110"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={user.user_metadata?.avatar_url || ''} 
                        alt={user.user_metadata?.full_name || 'User'} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </Link>
              ) : (
                /* Desktop: Dropdown menu */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative rounded-full h-10 w-10 p-0 text-primary bg-accent/50 border border-primary/20 transition-transform hover:scale-110"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={user.user_metadata?.avatar_url || ''} 
                          alt={user.user_metadata?.full_name || 'User'} 
                        />
                        <AvatarFallback className="bg-primary text-white">
                          {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 w-56 bg-white text-foreground shadow-elevation border border-gray-200 rounded-lg animate-scale-in">
                    <DropdownMenuLabel className="flex flex-col gap-1">
                      <span>{user.user_metadata?.full_name || user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Profile Settings */}
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                      <Link to="/profile" className="flex w-full items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Настройки профиля</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Universal Items */}
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                      <Link to="/notifications" className="flex w-full items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Уведомления</span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                      <Link to="/favorites" className="flex w-full items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Избранное</span>
                        {favorites.length > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {favorites.length > 99 ? '99+' : favorites.length}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Buyer-specific Items */}
                    {profile?.user_type === 'buyer' && (
                      <>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/buyer-dashboard" className="flex w-full items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Панель покупателя</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/buyer-orders" className="flex w-full items-center">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>Мои заказы</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/buyer-price-offers" className="flex w-full items-center">
                            <Gavel className="mr-2 h-4 w-4" />
                            <span>Торги</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Seller-specific Items */}
                    {profile?.user_type === 'seller' && (
                      <>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/seller/dashboard" className="flex w-full items-center">
                            <Store className="mr-2 h-4 w-4" />
                            <span>Панель продавца</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/seller/listings" className="flex w-full items-center">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Мои товары</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/seller/add-product" className="flex w-full items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Добавить товар</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/seller/orders" className="flex w-full items-center">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            <span>Мои заказы</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/seller/price-offers" className="flex w-full items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Предложения по товарам</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Admin Panel */}
                    {!isLoading && !isCheckingAdmin && isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                          <Link to="/admin" className="flex w-full items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Админ панель</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Help */}
                    <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary">
                      <Link to="/help" className="flex w-full items-center">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Помощь</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    
                    {/* Logout */}
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
