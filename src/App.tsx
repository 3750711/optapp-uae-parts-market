
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Import оптимизированных route configs
import { routeConfigs, preloadCriticalRoutes, preloadAdminRoutes, preloadSellerRoutes } from '@/utils/lazyRoutes';

// Оптимизированная конфигурация React Query с умным кэшированием
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Общие настройки
      retry: (failureCount, error: any) => {
        // Не повторяем 404 и 403 ошибки
        if (error?.status === 404 || error?.status === 403) return false;
        // Для админ панели больше попыток
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Настройки кэширования в зависимости от типа данных
      staleTime: (query) => {
        const queryKey = query.queryKey[0] as string;
        
        // Админ данные - кэшируем дольше
        if (queryKey === 'admin') {
          return 1000 * 60 * 10; // 10 минут для админ данных
        }
        
        // Профили пользователей - кэшируем дольше
        if (queryKey === 'profiles' || queryKey === 'profile') {
          return 1000 * 60 * 15; // 15 минут для профилей
        }
        
        // Продукты каталога - средний кэш
        if (queryKey === 'products' || queryKey === 'products-infinite-optimized') {
          return 1000 * 60 * 5; // 5 минут для продуктов
        }
        
        // Заказы - короткий кэш
        if (queryKey === 'orders') {
          return 1000 * 60 * 2; // 2 минуты для заказов
        }
        
        // По умолчанию
        return 1000 * 60 * 5; // 5 минут
      },
      
      gcTime: (query) => {
        const queryKey = query.queryKey[0] as string;
        
        // Админ данные держим в памяти дольше
        if (queryKey === 'admin') {
          return 1000 * 60 * 30; // 30 минут в памяти
        }
        
        // Остальные данные
        return 1000 * 60 * 15; // 15 минут в памяти
      },
      
      refetchOnMount: (query) => {
        const queryKey = query.queryKey[0] as string;
        const dataAge = Date.now() - (query.state.dataUpdatedAt || 0);
        
        // Для админ данных - не обновляем если данные свежие
        if (queryKey === 'admin' && dataAge < 1000 * 60 * 5) {
          return false;
        }
        
        // Для остальных данных - обновляем если старше 2 минут
        return dataAge > 1000 * 60 * 2;
      },
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Оптимизированный компонент загрузки
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Загрузка...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

function App() {
  // Создаем QueryClient один раз
  const [queryClient] = React.useState(() => createQueryClient());

  // Предзагружаем критические маршруты и отслеживаем роли пользователя
  React.useEffect(() => {
    preloadCriticalRoutes();
    
    // Отслеживаем изменения в localStorage для роли пользователя
    const handleUserRoleChange = () => {
      const cachedProfile = localStorage.getItem('auth_profile_cache');
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          if (profile.user_type === 'admin') {
            preloadAdminRoutes();
          } else if (profile.user_type === 'seller') {
            preloadSellerRoutes();
          }
        } catch (error) {
          console.warn('Failed to parse cached profile for preloading');
        }
      }
    };
    
    // Проверяем сразу и потом слушаем изменения
    handleUserRoleChange();
    window.addEventListener('storage', handleUserRoleChange);
    
    return () => {
      window.removeEventListener('storage', handleUserRoleChange);
    };
  }, []);

  return (
    <GlobalErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <Router>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {routeConfigs.map((route) => {
                      const { path, component: Component, protected: isProtected, adminOnly } = route;
                      
                      if (adminOnly) {
                        return (
                          <Route
                            key={path}
                            path={path}
                            element={
                              <AdminRoute>
                                <Component />
                              </AdminRoute>
                            }
                          />
                        );
                      }
                      
                      if (isProtected) {
                        return (
                          <Route
                            key={path}
                            path={path}
                            element={
                              <ProtectedRoute>
                                <Component />
                              </ProtectedRoute>
                            }
                          />
                        );
                      }
                      
                      return (
                        <Route
                          key={path}
                          path={path}
                          element={<Component />}
                        />
                      );
                    })}
                  </Routes>
                </Suspense>
              </Router>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
