import React, { memo, useEffect } from "react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { LatestProductsSection } from "./sections/LatestProductsSection";
import { FavoritesSection } from "./sections/FavoritesSection";
import { MyOffersSection } from "./sections/MyOffersSection";
import { RecentOrdersSection } from "./sections/RecentOrdersSection";
import { QuickActionsSection } from "./sections/QuickActionsSection";


const FastBuyerDashboard = memo(() => {
  const { startTimer } = usePerformanceMonitor();

  useEffect(() => {
    const timer = startTimer('buyer-dashboard-render');
    return () => {
      timer.end();
    };
  }, [startTimer]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">Панель покупателя</h2>
        <p className="text-muted-foreground mt-1">Добро пожаловать в ваш персональный кабинет</p>
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