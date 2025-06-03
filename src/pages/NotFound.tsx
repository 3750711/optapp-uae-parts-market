
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, LayoutDashboard, MessageCircle } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const NotFound = () => {
  const location = useLocation();
  const { isAdmin } = useAdminAccess();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-optapp-yellow">404</h1>
          <h2 className="text-3xl font-bold mt-6 mb-4">Страница не найдена</h2>
          <p className="text-lg text-gray-600 mb-4">
            Извините, но страница, которую вы искали, не существует или вы не имеете к ней доступа.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 text-left">
                <strong>Пожалуйста, если страница не работает, отправьте сообщение нашему администратору, чтобы мы знали и исправили.</strong> Это поможет нам создать лучшую платформу для закупки запчастей из ОАЭ!
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/">
              <Button className="w-full sm:w-auto bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться на главную
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" className="w-full sm:w-auto border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Перейти в каталог
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Админ панель
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
