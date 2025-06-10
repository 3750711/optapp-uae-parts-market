
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, LayoutDashboard, MessageCircle, Send, AlertTriangle } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const NotFound = () => {
  const location = useLocation();
  const { isAdmin } = useAdminAccess();

  useEffect(() => {
    // Расширенное логирование для диагностики проблем маршрутизации
    console.error("404 Error Details:", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }, [location]);

  // Создаем ссылку на Telegram с предзаполненным сообщением и расширенной диагностикой
  const telegramLink = `https://t.me/Nastya_PostingLots_OptCargo?text=Здравствуйте! Обнаружена проблема на странице: ${window.location.href}%0A%0AОписание проблемы: страница не найдена (404)%0A%0AДополнительная информация:%0A- Путь: ${location.pathname}%0A- Параметры: ${location.search}%0A- Время: ${new Date().toLocaleString('ru-RU')}%0A%0AПожалуйста, проверьте и исправьте данную ошибку.`;

  // Определяем, может ли это быть проблемой с админскими маршрутами
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSellerRoute = location.pathname.startsWith('/seller');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold mt-6 mb-4">Страница не найдена</h2>
          <p className="text-lg text-gray-600 mb-4">
            Мы работаем над созданием лучшей платформы для закупа запчастей из ОАЭ, но возможно эту страницу мы еще не доделали.
          </p>
          
          {/* Диагностическая информация для разработчиков */}
          {(isAdminRoute || isSellerRoute) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm text-orange-800 mb-2">
                    <strong>Возможная проблема с маршрутами:</strong>
                  </p>
                  <p className="text-xs text-orange-700 font-mono bg-orange-100 p-2 rounded">
                    Путь: {location.pathname}
                  </p>
                  {isAdminRoute && (
                    <p className="text-xs text-orange-700 mt-1">
                      Убедитесь, что у вас есть права администратора и маршрут существует в lazyRoutes.tsx
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Пожалуйста, если страница не работает, отправьте сообщение нашему администратору, чтобы мы знали и исправили.</strong>
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
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться на главную
              </Button>
            </Link>
            <Link to="/catalog">
              <Button variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
