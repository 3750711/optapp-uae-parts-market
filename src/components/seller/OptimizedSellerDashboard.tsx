
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
      const userDataText = `I have a problem boss, my ID is ${profile?.opt_id || 'Not specified'}`;
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
      title: "Добавить товар",
      description: "Разместите новый товар на маркетплейсе",
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      to: "/seller/listings",
      icon: FileText,
      title: "Мой склад",
      description: "Просмотр всех ваших товаров на складе",
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      to: "/seller/sell-product",
      icon: ShoppingCart,
      title: "Продать товар",
      description: "Создайте заказ из ваших товаров",
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
    },
    {
      to: "/seller/create-order",
      icon: ShoppingBag,
      title: "Создать заказ",
      description: "Оформите новый заказ",
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    },
    {
      to: "/catalog",
      icon: Layers,
      title: "Каталог",
      description: "Просмотр всех доступных товаров",
      color: "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
    },
    {
      to: "/seller/orders",
      icon: ListOrdered,
      title: "Мои заказы",
      description: "Просмотр и управление заказами",
      color: "border-red-200 hover:border-red-300 hover:bg-red-50"
    }
  ];

  const contactAdminItem = {
    onClick: handleContactAdmin,
    icon: MessageCircle,
    title: "Связаться с админом",
    description: "Получите помощь от администратора",
    color: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Панель продавца</h2>
          <p className="text-muted-foreground mt-1">Управляйте своими товарами и заказами</p>
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
