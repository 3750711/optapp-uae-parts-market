import React, { memo, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useFavorites } from "@/hooks/useFavorites";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { useNotifications } from "@/hooks/useNotifications";

// SVG Icons as components for better performance
const CatalogIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
));

const HeartIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
));

const DollarSignIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
));

const ShoppingCartIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
));

const FileSearchIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <circle cx="11.5" cy="14.5" r="2.5"/>
    <path d="M13.25 16.25L15 18"/>
  </svg>
));

const BellIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
));

const StoreIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V11l-6-4"/>
  </svg>
));

const PlusCircleIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>
));

// Set display names
CatalogIcon.displayName = "CatalogIcon";
HeartIcon.displayName = "HeartIcon";
DollarSignIcon.displayName = "DollarSignIcon";
ShoppingCartIcon.displayName = "ShoppingCartIcon";
FileSearchIcon.displayName = "FileSearchIcon";
BellIcon.displayName = "BellIcon";
StoreIcon.displayName = "StoreIcon";
PlusCircleIcon.displayName = "PlusCircleIcon";

const FastBuyerDashboard = memo(() => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { startTimer } = usePerformanceMonitor();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { data: orders, isLoading: ordersLoading } = useBuyerOrders();
  const { unreadCount, loading: notificationsLoading } = useNotifications();

  useEffect(() => {
    const timer = startTimer('buyer-dashboard-render');
    return () => {
      timer.end();
    };
  }, [startTimer]);

  const getInitials = useCallback((name: string | null | undefined): string => {
    if (!name) return 'B';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }, []);

  const favoritesCount = useMemo(() => {
    if (!favorites) return 0;
    return favorites.length;
  }, [favorites]);

  const activeOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(order => 
      order.status !== 'completed' && order.status !== 'cancelled'
    ).length;
  }, [orders]);

  const dashboardItems = useMemo(() => [
    {
      to: "/catalog",
      icon: CatalogIcon,
      title: "Каталог товаров",
      description: "Найдите нужные автозапчасти среди тысяч предложений",
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      to: "/favorites",
      icon: HeartIcon,
      title: "Избранное",
      description: "Ваши сохраненные товары для быстрого доступа",
      color: "border-red-200 hover:border-red-300 hover:bg-red-50",
      showBadge: true,
      badgeCount: favoritesCount,
      badgeLoading: favoritesLoading
    },
    {
      to: "/buyer-price-offers",
      icon: DollarSignIcon,
      title: "Мои предложения",
      description: "Отслеживайте статус ваших ценовых предложений",
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      to: "/buyer-orders",
      icon: ShoppingCartIcon,
      title: "Мои заказы",
      description: "Просматривайте историю и статус ваших заказов",
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50",
      showBadge: true,
      badgeCount: activeOrdersCount,
      badgeLoading: ordersLoading
    },
    {
      to: "/requests",
      icon: FileSearchIcon,
      title: "Запросы деталей",
      description: "Найдите нужную деталь через запрос сообществу",
      color: "border-teal-200 hover:border-teal-300 hover:bg-teal-50"
    },
    {
      to: "/notifications",
      icon: BellIcon,
      title: "Уведомления",
      description: "Важные обновления по вашим заказам и предложениям",
      color: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50",
      showBadge: true,
      badgeCount: unreadCount,
      badgeLoading: notificationsLoading
    },
    {
      to: "/stores",
      icon: StoreIcon,
      title: "Магазины",
      description: "Каталог проверенных продавцов автозапчастей",
      color: "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
    },
    {
      to: "/create-request",
      icon: PlusCircleIcon,
      title: "Создать запрос",
      description: "Опубликуйте запрос на поиск нужной детали",
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    }
  ], [favoritesCount, favoritesLoading, activeOrdersCount, ordersLoading, unreadCount, notificationsLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Панель покупателя</h2>
          <p className="text-muted-foreground mt-1">Добро пожаловать в ваш персональный кабинет</p>
        </div>
        <Link to="/profile-menu" className="shrink-0">
          <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} hover:scale-110 transition-transform cursor-pointer border-2 border-primary/20 bg-background`}>
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Buyer'} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      
      <div className="dashboard-grid">
        {dashboardItems.map((item, index) => (
          <Link key={index} to={item.to} className="block">
            <div className={`fast-card h-full bg-white rounded-lg border ${item.color} ${isMobile ? 'mobile-card touch-target' : ''}`}>
              <div className={isMobile ? "pb-2 pt-4 px-6" : "pb-2 px-6 pt-6"}>
                <div className="relative">
                  <item.icon />
                  {item.showBadge && !item.badgeLoading && item.badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    >
                      {item.badgeCount}
                    </Badge>
                  )}
                  {item.showBadge && item.badgeLoading && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className={`px-6 pb-6 ${isMobile ? "pt-0" : ""}`}>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold tracking-tight mb-2`}>
                  {item.title}
                </h3>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

FastBuyerDashboard.displayName = "FastBuyerDashboard";

export default FastBuyerDashboard;