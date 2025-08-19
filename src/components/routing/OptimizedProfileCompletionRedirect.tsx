import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface OptimizedProfileCompletionRedirectProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  excludedRoles?: string[];
}

// Мемоизированный компонент для предотвращения лишних ре-рендеров
const OptimizedProfileCompletionRedirect = React.memo(({ 
  children, 
  allowedRoles,
  excludedRoles 
}: OptimizedProfileCompletionRedirectProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Показываем загрузку только при необходимости
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Проверяем profile completion только для аутентифицированных пользователей
  // и только если это не Telegram пользователь (для них отдельная модальная логика)
  if (user && profile && !profile.profile_completed && profile.auth_method !== 'telegram') {
    // Для неполных профилей продавцов - перенаправляем на заполнение
    if (profile.user_type === 'seller' && location.pathname !== '/seller/profile') {
      return <Navigate to="/seller/profile" replace />;
    }
    
    // Для неполных профилей покупателей - перенаправляем на профиль
    if (profile.user_type === 'buyer' && location.pathname !== '/profile') {
      return <Navigate to="/profile" replace />;
    }
  }
  
  // Проверяем роли если они указаны
  if (user && profile) {
    if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    if (excludedRoles && excludedRoles.includes(profile.user_type)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // Все проверки пройдены - показываем контент
  return <>{children}</>;
});

OptimizedProfileCompletionRedirect.displayName = 'OptimizedProfileCompletionRedirect';

export default OptimizedProfileCompletionRedirect;