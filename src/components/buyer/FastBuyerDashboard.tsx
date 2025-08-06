import React, { memo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { LatestProductsSection } from "./sections/LatestProductsSection";
import { FavoritesSection } from "./sections/FavoritesSection";
import { MyOffersSection } from "./sections/MyOffersSection";
import { RecentOrdersSection } from "./sections/RecentOrdersSection";
import { QuickActionsSection } from "./sections/QuickActionsSection";


const FastBuyerDashboard = memo(() => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { startTimer } = usePerformanceMonitor();

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

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Quick Actions */}
      <QuickActionsSection />
      
      {/* Latest Products */}
      <LatestProductsSection />
      
      {/* Favorites */}
      <FavoritesSection />
      
      {/* My Offers */}
      <MyOffersSection />
      
      {/* Recent Orders */}
      <RecentOrdersSection />
    </div>
  );
});

FastBuyerDashboard.displayName = "FastBuyerDashboard";

export default FastBuyerDashboard;