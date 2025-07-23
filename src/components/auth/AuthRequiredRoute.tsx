
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RestrictedAccessNotice from '@/components/home/RestrictedAccessNotice';

interface AuthRequiredRouteProps {
  children: React.ReactNode;
}

const AuthRequiredRoute: React.FC<AuthRequiredRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <svg className="h-8 w-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
          </svg>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем RestrictedAccessNotice
  if (!user) {
    return <RestrictedAccessNotice currentPath={location.pathname} />;
  }

  // Если авторизован, показываем содержимое
  return <>{children}</>;
};

export default AuthRequiredRoute;
