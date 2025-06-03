
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, LayoutDashboard, MessageCircle, Send } from "lucide-react";
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

  // Создаем ссылку на Telegram с предзаполненным сообщением
  const telegramLink = `https://t.me/your_manager_username?text=Здравствуйте! Обнаружена проблема на странице: ${window.location.href}%0A%0AОписание проблемы: страница не найдена (404)%0A%0AПожалуйста, проверьте и исправьте данную ошибку.`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-optapp-yellow">404</h1>
          <h2 className="text-3xl font-bold mt-6 mb-4">Страница не найдена</h2>
          <p className="text-lg text-gray-600 mb-4">
            Мы работаем над созданием лучшей платформы для закупа запчастей из ОАЭ, но возможно эту страницу мы еще не доделали.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Пожалуйста, если страница не работает, отправьте сообщение нашему администратору, чтобы мы знали и исправили.</strong> Это поможет нам создать лучшую платформу для закупки запчастей из ОАЭ!
                </p>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Отправить ошибку администратору
                </a>
              </div>
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
