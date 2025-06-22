
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

const OrdersRedirect = () => {
  const { profile, user } = useAuth();

  // Показываем загрузку пока загружается профиль
  if (user && !profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <svg className="h-8 w-8 animate-spin text-optapp-yellow" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
      </Layout>
    );
  }

  // Если пользователь не авторизован, редиректим на вход
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Редиректим в зависимости от типа пользователя
  if (profile?.user_type === 'seller') {
    return <Navigate to="/seller/orders" replace />;
  } else {
    return <Navigate to="/buyer/orders" replace />;
  }
};

export default OrdersRedirect;
