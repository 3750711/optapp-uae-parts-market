import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, ShoppingBag, Layers, MessageCircle, ListOrdered, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const SellerDashboard = () => {
  const { profile } = useAuth();

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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Панель продавца</h2>
      <p className="text-muted-foreground">Управляйте своими товарами и заказами</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/seller/add-product">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <PlusCircle className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Добавить товар</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Разместите новый товар на маркетплейсе
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seller/listings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <FileText className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Мой склад</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Просмотр всех ваших товаров на складе
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/seller/create-order">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <ShoppingBag className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Создать заказ</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Оформите новый заказ
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/catalog">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <Layers className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Каталог</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Просмотр всех доступных товаров
              </p>
            </CardContent>
          </Card>
        </Link>

        <div onClick={handleContactAdmin} className="cursor-pointer">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <MessageCircle className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Связаться с админом</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Получите помощь от администратора
              </p>
            </CardContent>
          </Card>
        </div>

        <Link to="/seller/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white border-optapp-yellow">
            <CardHeader className="pb-2">
              <ListOrdered className="h-8 w-8 text-optapp-yellow" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">Мои заказы</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Просмотр и управление заказами
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default SellerDashboard;
