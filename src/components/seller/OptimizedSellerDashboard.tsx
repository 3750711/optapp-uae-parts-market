
import React from "react";
import { 
  Package, 
  Warehouse, 
  ShoppingCart, 
  ClipboardList, 
  BookOpen, 
  MessageCircle,
  List
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import { OptimizedDashboardGrid } from "./OptimizedDashboardGrid";
import { MobileDashboardHeader } from "./MobileDashboardHeader";

const OptimizedSellerDashboard = () => {
  const { profile } = useAuth();
  const { isMobile, shouldUseCompactComponents } = useMobileLayout();

  const handleContactAdmin = () => {
    const userID = profile?.id || 'unknown';
    const message = `Здравствуйте! Мой ID: ${userID}. У меня есть вопрос:`;
    const telegramLink = `https://t.me/optapp_admin?text=${encodeURIComponent(message)}`;
    window.open(telegramLink, '_blank');
  };

  const dashboardItems = [
    {
      title: "Добавить товар",
      description: "Создать новый товар для продажи",
      href: "/seller/products/add",
      icon: Package,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    },
    {
      title: "Мой склад",
      description: "Управление товарами на складе",
      href: "/seller/products",
      icon: Warehouse,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    },
    {
      title: "Продать товар",
      description: "Быстрая продажа существующего товара",
      href: "/seller/products/sell",
      icon: ShoppingCart,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    },
    {
      title: "Мои заказы",
      description: "Просмотр и управление заказами",
      href: "/seller/orders",
      icon: ClipboardList,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    },
    {
      title: "Каталог",
      description: "Просмотр всех товаров в системе",
      href: "/catalog",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    },
    {
      title: "Мои предложения",
      description: "Управление ценовыми предложениями",
      href: "/seller/price-offers",
      icon: List,
      color: "text-primary",
      bgColor: "hover:bg-primary/5"
    }
  ];

  const contactAdminItem = {
    title: "Связаться с админом",
    description: "Получить помощь или задать вопрос",
    href: "#",
    icon: MessageCircle,
    color: "text-destructive",
    bgColor: "hover:bg-destructive/5",
    onClick: handleContactAdmin
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Optimized Header */}
      <MobileDashboardHeader 
        userName={profile?.full_name}
        userAvatar={profile?.avatar_url}
      />

      {/* Optimized Dashboard Grid */}
      <OptimizedDashboardGrid 
        items={[...dashboardItems, contactAdminItem]}
        className={shouldUseCompactComponents ? "gap-3" : "gap-4 md:gap-6"}
      />
    </div>
  );
};

export default OptimizedSellerDashboard;
