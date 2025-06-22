
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import Layout from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

const OrdersRedirect = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = authLoading || profileLoading;

  // Показываем загрузку пока загружается профиль
  if (user && isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </Layout>
    );
  }

  // Если пользователь не авторизован, редиректим на вход
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если нет профиля, ждем загрузки
  if (!profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </Layout>
    );
  }

  // Редиректим в зависимости от типа пользователя
  if (profile.user_type === 'seller') {
    return <Navigate to="/seller/orders" replace />;
  } else {
    return <Navigate to="/buyer/orders" replace />;
  }
};

export default OrdersRedirect;
