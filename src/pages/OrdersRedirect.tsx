
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

const OrdersRedirect = () => {
  const { user, profile, isLoading } = useAuth();

  // Показываем загрузку пока проверяем аутентификацию и загружаем профиль
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <svg className="h-8 w-8 animate-spin text-optapp-yellow mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
            </svg>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Если пользователь не авторизован, редиректим на вход
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если профиль не загрузился, показываем ошибку
  if (!profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Ошибка загрузки профиля</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-optapp-yellow text-white rounded hover:bg-yellow-600"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Редиректим в зависимости от типа пользователя
  if (profile.user_type === 'seller') {
    return <Navigate to="/seller/orders" replace />;
  } else {
    return <Navigate to="/buyer-orders" replace />;
  }
};

export default OrdersRedirect;
