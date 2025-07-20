
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  User, 
  LogOut, 
  Package, 
  ShoppingCart, 
  Plus, 
  Settings, 
  LayoutDashboard, 
  Store, 
  MessageSquare,
  Bell,
  Heart,
  HelpCircle,
  ClipboardList,
  ShoppingBag
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileProfileMenu = () => {
  const { user, signOut, profile } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { unreadCount } = useNotifications();
  const { favorites } = useFavorites();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Redirect to desktop if not mobile
  React.useEffect(() => {
    if (!isMobile) {
      navigate('/');
    }
  }, [isMobile, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы"
      });
      navigate('/');
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive"
      });
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Профиль</h1>
        <div className="w-10" />
      </div>

      {/* Profile Section */}
      <div className="p-6 bg-accent/10">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user.user_metadata?.avatar_url || ''} 
              alt={user.user_metadata?.full_name || 'User'} 
            />
            <AvatarFallback className="bg-primary text-white text-2xl">
              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {user.user_metadata?.full_name || 'Пользователь'}
            </h2>
            {profile.opt_id && (
              <p className="text-sm text-muted-foreground">
                OPT ID: {profile.opt_id}
              </p>
            )}
            {profile.telegram && (
              <p className="text-sm text-muted-foreground">
                @{profile.telegram.replace('@', '')}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {/* Profile Settings */}
        <Link to="/profile">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Settings className="mr-3 h-5 w-5" />
            Настройки профиля
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Universal Items */}
        <Link to="/notifications">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Bell className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">Уведомления</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <Link to="/favorites">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Heart className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">Избранное</span>
            {favorites.length > 0 && (
              <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-0">
                {favorites.length > 99 ? '99+' : favorites.length}
              </Badge>
            )}
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Buyer-specific Items */}
        {profile?.user_type === 'buyer' && (
          <>
            <Link to="/buyer-orders">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <ShoppingCart className="mr-3 h-5 w-5" />
                Мои заказы
              </Button>
            </Link>
            <Link to="/buyer-price-offers">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <Package className="mr-3 h-5 w-5" />
                Мои предложения цены
              </Button>
            </Link>
            <Separator className="my-4" />
          </>
        )}

        {/* Seller-specific Items */}
        {profile?.user_type === 'seller' && (
          <>
            <Link to="/seller/dashboard">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <Store className="mr-3 h-5 w-5" />
                Панель продавца
              </Button>
            </Link>
            <Link to="/seller/listings">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <Package className="mr-3 h-5 w-5" />
                Мои товары
              </Button>
            </Link>
            <Link to="/seller/add-product">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <Plus className="mr-3 h-5 w-5" />
                Добавить товар
              </Button>
            </Link>
            <Link to="/seller/orders">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <ClipboardList className="mr-3 h-5 w-5" />
                Мои заказы
              </Button>
            </Link>
            <Link to="/seller/price-offers">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <MessageSquare className="mr-3 h-5 w-5" />
                Предложения по товарам
              </Button>
            </Link>
            <Separator className="my-4" />
          </>
        )}
        
        {/* Admin Panel */}
        {isAdmin && (
          <>
            <Link to="/admin">
              <Button variant="ghost" className="w-full justify-start h-12 text-base">
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Админ панель
              </Button>
            </Link>
            <Separator className="my-4" />
          </>
        )}

        {/* Help */}
        <Link to="/help">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <HelpCircle className="mr-3 h-5 w-5" />
            Помощь
          </Button>
        </Link>

        <Separator className="my-4" />
        
        {/* Logout */}
        <Button 
          onClick={handleLogout} 
          variant="ghost" 
          className="w-full justify-start h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Выйти
        </Button>
      </div>
    </div>
  );
};

export default MobileProfileMenu;
