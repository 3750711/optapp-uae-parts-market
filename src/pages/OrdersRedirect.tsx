
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const OrdersRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        navigate('/login?from=/orders', { replace: true });
      } else {
        // Определяем тип пользователя и перенаправляем на соответствующую страницу заказов
        const userType = user.user_metadata?.user_type;
        
        switch (userType) {
          case 'seller':
            navigate('/seller/orders', { replace: true });
            break;
          case 'buyer':
            navigate('/buyer/orders', { replace: true });
            break;
          case 'admin':
            navigate('/admin/orders', { replace: true });
            break;
          default:
            // Если тип пользователя не определен, отправляем на страницу профиля
            navigate('/profile', { replace: true });
            break;
        }
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Перенаправление...</span>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OrdersRedirect;
