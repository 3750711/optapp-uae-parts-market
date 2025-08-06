import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, ShoppingBag, Heart, Package, FileText, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserStats } from './UserStats';
import { ModernOrderCard } from './ModernOrderCard';
import { ModernOfferCard } from './ModernOfferCard';
import { EmptyState } from './EmptyState';
import { useBuyerOrders } from '@/hooks/useBuyerOrders';
import { useFavorites } from '@/hooks/useFavorites';

const ModernBuyerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('orders');
  
  const { data: orders = [], isLoading: ordersLoading } = useBuyerOrders();
  const { favorites, isLoading: favoritesLoading } = useFavorites();

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'B';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const quickActions = [
    {
      to: '/create-request',
      icon: Plus,
      label: 'Создать запрос',
      variant: 'default' as const,
      description: 'Найти нужную запчасть'
    },
    {
      to: '/catalog',
      icon: Search,
      label: 'Каталог',
      variant: 'outline' as const,
      description: 'Просмотр товаров'
    },
    {
      to: '/buyer-orders',
      icon: Package,
      label: 'Мои заказы',
      variant: 'outline' as const,
      description: 'История покупок'
    },
    {
      to: '/favorites',
      icon: Heart,
      label: 'Избранное',
      variant: 'outline' as const,
      description: 'Сохраненные товары'
    }
  ];

  const recentOrders = orders?.slice(0, 3) || [];
  const recentFavorites = favorites?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Welcome Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-blue-100">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Buyer'} />
                <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-semibold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  {profile?.full_name ? `Привет, ${profile.full_name.split(' ')[0]}!` : 'Добро пожаловать!'}
                </h1>
                <p className="text-slate-600 mt-1">Рады видеть вас снова</p>
              </div>
            </div>
            <Link to="/notifications" className="relative">
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Bell className="h-5 w-5" />
              </Button>
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Link>
          </div>

          {/* User Stats */}
          <UserStats />

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Быстрые действия</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.to}
                  variant={action.variant}
                  asChild
                  className={`h-auto p-4 flex-col gap-2 ${
                    action.variant === 'default' ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                >
                  <Link to={action.to}>
                    <action.icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs opacity-80 mt-1">{action.description}</div>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-50">
            <TabsTrigger value="orders" className="relative">
              Заказы
              {orders?.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                  {orders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="offers" className="relative">
              Предложения
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                0
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="relative">
              Избранное
              {favorites?.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                  {favorites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {ordersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="aspect-square bg-slate-100 rounded-lg mb-4 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                      <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentOrders.map((order) => (
                    <ModernOrderCard key={order.id} order={order} />
                  ))}
                </div>
                {orders.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link to="/buyer-orders">Посмотреть все заказы</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Package}
                title="У вас пока нет заказов"
                description="Найдите запчасти в каталоге и сделайте первый заказ!"
                actionLabel="Перейти в каталог"
                actionTo="/catalog"
              />
            )}
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <EmptyState
              icon={FileText}
              title="У вас пока нет предложений"
              description="Оставляйте предложения о цене продавцам для выгодных покупок!"
              actionLabel="Найти товары"
              actionTo="/catalog"
            />
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            {favoritesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="aspect-square bg-slate-100 rounded-lg mb-4 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                      <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentFavorites.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentFavorites.map((productId) => (
                    <div key={productId} className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="aspect-square bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                        <Heart className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium">Товар в избранном</div>
                        <div className="text-sm text-slate-600">ID: {productId}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {favorites.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link to="/favorites">Посмотреть все избранное</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={Heart}
                title="У вас пока нет избранных товаров"
                description="Добавляйте товары в избранное для быстрого доступа!"
                actionLabel="Найти товары"
                actionTo="/catalog"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModernBuyerDashboard;