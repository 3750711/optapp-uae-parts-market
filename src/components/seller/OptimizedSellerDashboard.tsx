
import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, ShoppingBag, Layers, MessageCircle, ListOrdered, FileText, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerDashboardTranslations } from '@/utils/translations/sellerDashboard';

const OptimizedSellerDashboard = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const t = getSellerDashboardTranslations(language);

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'S';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const handleContactAdmin = () => {
    try {
      const userDataText = `${t.contactAdminMessage} ${profile?.opt_id || t.notSpecified}`;
      const encodedText = encodeURIComponent(userDataText);
      const telegramLink = `https://t.me/ElenaOPTcargo?text=${encodedText}`;
      
      console.log('Telegram Contact Link:', telegramLink);
      
      window.open(telegramLink, '_blank');
    } catch (error) {
      window.open('https://t.me/ElenaOPTcargo', '_blank');
    }
  };

  const dashboardItems = [
    {
      to: "/seller/add-product",
      icon: PlusCircle,
      title: t.addProduct.title,
      description: t.addProduct.description,
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      to: "/seller/listings",
      icon: FileText,
      title: t.myWarehouse.title,
      description: t.myWarehouse.description,
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      to: "/seller/sell-product",
      icon: ShoppingCart,
      title: t.sellProduct.title,
      description: t.sellProduct.description,
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
    },
    {
      to: "/seller/price-offers",
      icon: DollarSign,
      title: t.priceOffers.title,
      description: t.priceOffers.description,
      color: "border-teal-200 hover:border-teal-300 hover:bg-teal-50"
    },
    {
      to: "/seller/create-order",
      icon: ShoppingBag,
      title: t.createOrder.title,
      description: t.createOrder.description,
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    },
    {
      to: "/seller/orders",
      icon: ListOrdered,
      title: t.myOrders.title,
      description: t.myOrders.description,
      color: "border-red-200 hover:border-red-300 hover:bg-red-50"
    }
  ];

  const contactAdminItem = {
    onClick: handleContactAdmin,
    icon: MessageCircle,
    title: t.contactAdmin.title,
    description: t.contactAdmin.description,
    color: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">{t.pageTitle}</h2>
          <p className="text-muted-foreground mt-1">{t.pageSubtitle}</p>
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
      
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
        {dashboardItems.map((item, index) => (
          <Link key={index} to={item.to} className="block">
            <Card className={`h-full hover:shadow-lg transition-all duration-200 cursor-pointer bg-white ${item.color} ${isMobile ? 'py-2' : ''}`}>
              <CardHeader className={isMobile ? "pb-2 pt-4" : "pb-2"}>
                <item.icon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-optapp-yellow`} />
              </CardHeader>
              <CardContent className={isMobile ? "pt-0" : ""}>
                <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} mb-2`}>
                  {item.title}
                </CardTitle>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Contact admin card */}
        <div onClick={contactAdminItem.onClick} className="cursor-pointer">
          <Card className={`h-full hover:shadow-lg transition-all duration-200 cursor-pointer bg-white ${contactAdminItem.color} ${isMobile ? 'py-2' : ''}`}>
            <CardHeader className={isMobile ? "pb-2 pt-4" : "pb-2"}>
              <contactAdminItem.icon className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-optapp-yellow`} />
            </CardHeader>
            <CardContent className={isMobile ? "pt-0" : ""}>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} mb-2`}>
                {contactAdminItem.title}
              </CardTitle>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                {contactAdminItem.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OptimizedSellerDashboard;
