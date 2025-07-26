
import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, ShoppingBag, Layers, MessageCircle, ListOrdered, FileText, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const OptimizedSellerDashboard = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const handleContactAdmin = () => {
    try {
      const userDataText = `Hello, I need assistance. My ID is ${profile?.opt_id || 'Not specified'}`;
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
      title: "Add Product",
      description: "List a new product on the marketplace",
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      to: "/seller/listings",
      icon: FileText,
      title: "My Warehouse",
      description: "View all your warehouse products",
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      to: "/seller/sell-product",
      icon: ShoppingCart,
      title: "Sell Product",
      description: "Create an order from your products",
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
    },
    {
      to: "/seller/create-order",
      icon: ShoppingBag,
      title: "Create Order",
      description: "Process a new order",
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    },
    {
      to: "/catalog",
      icon: Layers,
      title: "Catalog",
      description: "Browse all available products",
      color: "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
    },
    {
      to: "/seller/orders",
      icon: ListOrdered,
      title: "My Orders",
      description: "View and manage orders",
      color: "border-red-200 hover:border-red-300 hover:bg-red-50"
    }
  ];

  const contactAdminItem = {
    onClick: handleContactAdmin,
    icon: MessageCircle,
    title: "Contact Admin",
    description: "Get help from administrator",
    color: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Seller Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage your products and orders</p>
        </div>
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
