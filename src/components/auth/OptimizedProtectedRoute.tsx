
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "@/hooks/use-toast";

interface OptimizedProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const OptimizedProtectedRoute = ({ children, allowedRoles }: OptimizedProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Минимальная загрузка только при первичной инициализации
  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Быстрый редирект на логин
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  // Если пользователь есть, но профиль загружается, показываем компактную загрузку
  if (!profile) {
    return (
      <div className="flex h-[100px] items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-optapp-yellow"></div>
      </div>
    );
  }
  
  // Проверяем блокировку
  if (profile.verification_status === 'blocked') {
    toast({
      title: "Доступ ограничен",
      description: "Ваш аккаунт заблокирован. Вы можете только просматривать сайт.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }
  
  // Проверяем роли
  if (allowedRoles && !allowedRoles.includes(profile.user_type)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default OptimizedProtectedRoute;
