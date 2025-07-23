
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

interface AuthRequiredRouteProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const AuthRequiredRoute: React.FC<AuthRequiredRouteProps> = ({ 
  children, 
  title = "Необходима авторизация",
  description = "Для доступа к этой странице необходимо войти в систему"
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
            <p className="text-gray-600">Проверка авторизации...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-optapp-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-8 w-8 text-optapp-yellow" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {title}
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                {description}
              </p>
              
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Что вас ждет после регистрации:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-optapp-yellow rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Доступ к полному каталогу автозапчастей</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-optapp-yellow rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Прямой контакт с поставщиками</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-optapp-yellow rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Управление заказами и запросами</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-optapp-yellow rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Оптовые цены без посредников</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-optapp-yellow hover:bg-optapp-yellow/90">
                  <Link to="/register">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Зарегистрироваться
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">
                    <LogIn className="h-5 w-5 mr-2" />
                    Войти
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                Регистрация займет всего несколько минут
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
};

export default AuthRequiredRoute;
