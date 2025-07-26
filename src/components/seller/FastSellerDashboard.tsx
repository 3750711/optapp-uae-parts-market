import React, { memo, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// SVG Icons as components for better performance
const PlusCircleIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>
));

const FileTextIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
));

const ShoppingCartIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
));

const DollarSignIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
));

const ShoppingBagIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
));

const ListOrderedIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4"/>
    <path d="M4 10h2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-1-1.5"/>
  </svg>
));

const MessageCircleIcon = memo(() => (
  <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
));

// Set display names
PlusCircleIcon.displayName = "PlusCircleIcon";
FileTextIcon.displayName = "FileTextIcon";
ShoppingCartIcon.displayName = "ShoppingCartIcon";
DollarSignIcon.displayName = "DollarSignIcon";
ShoppingBagIcon.displayName = "ShoppingBagIcon";
ListOrderedIcon.displayName = "ListOrderedIcon";
MessageCircleIcon.displayName = "MessageCircleIcon";

const FastSellerDashboard = memo(() => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { startTimer } = usePerformanceMonitor();

  useEffect(() => {
    const timer = startTimer('seller-dashboard-render');
    return () => {
      timer.end();
    };
  }, [startTimer]);

  const getInitials = useCallback((name: string | null | undefined): string => {
    if (!name) return 'S';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }, []);

  const handleContactAdmin = useCallback(() => {
    try {
      const userDataText = `Hello, I need assistance. My ID is ${profile?.opt_id || 'Not specified'}`;
      const encodedText = encodeURIComponent(userDataText);
      const telegramLink = `https://t.me/ElenaOPTcargo?text=${encodedText}`;
      window.open(telegramLink, '_blank');
    } catch (error) {
      window.open('https://t.me/ElenaOPTcargo', '_blank');
    }
  }, [profile?.opt_id]);

  const dashboardItems = useMemo(() => [
    {
      to: "/seller/add-product",
      icon: PlusCircleIcon,
      title: "Add Product",
      description: "List a new product on the marketplace",
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      to: "/seller/listings",
      icon: FileTextIcon,
      title: "My Warehouse",
      description: "View all your warehouse products",
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      to: "/seller/sell-product",
      icon: ShoppingCartIcon,
      title: "Sell Product",
      description: "Create an order from your products",
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
    },
    {
      to: "/seller/price-offers",
      icon: DollarSignIcon,
      title: "Price Offers",
      description: "Manage price offers from buyers",
      color: "border-teal-200 hover:border-teal-300 hover:bg-teal-50"
    },
    {
      to: "/seller/create-order",
      icon: ShoppingBagIcon,
      title: "Create Order",
      description: "Process a new order",
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    },
    {
      to: "/seller/orders",
      icon: ListOrderedIcon,
      title: "My Orders",
      description: "View and manage orders",
      color: "border-red-200 hover:border-red-300 hover:bg-red-50"
    }
  ], []);

  const contactAdminItem = useMemo(() => ({
    onClick: handleContactAdmin,
    icon: MessageCircleIcon,
    title: "Contact Admin",
    description: "Get help from administrator",
    color: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
  }), [handleContactAdmin]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Seller Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage your products and orders</p>
        </div>
        <Link to="/seller/profile-menu" className="shrink-0">
          <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} hover:scale-110 transition-transform cursor-pointer border-2 border-primary/20 bg-background`}>
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Seller'} />
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
                <item.icon />
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

        {/* Contact admin card */}
        <div onClick={contactAdminItem.onClick} className="cursor-pointer">
          <div className={`fast-card h-full bg-white rounded-lg border ${contactAdminItem.color} ${isMobile ? 'mobile-card touch-target' : ''}`}>
            <div className={isMobile ? "pb-2 pt-4 px-6" : "pb-2 px-6 pt-6"}>
              <contactAdminItem.icon />
            </div>
            <div className={`px-6 pb-6 ${isMobile ? "pt-0" : ""}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold tracking-tight mb-2`}>
                {contactAdminItem.title}
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                {contactAdminItem.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FastSellerDashboard.displayName = "FastSellerDashboard";

export default FastSellerDashboard;