
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import RegionBlockingNotice from '@/components/ui/RegionBlockingNotice';

// Import оптимизированных route configs
import { routeConfigs, preloadCriticalRoutes, preloadAdminRoutes, preloadSellerRoutes } from '@/utils/lazyRoutes';

// Импортируем систему мониторинга ошибок
import '@/utils/errorReporting';

// Оптимизированная конфигурация React Query
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 5, // 5 минут
      gcTime: 1000 * 60 * 15, // 15 минут
      refetchOnMount: (query) => {
        const dataAge = Date.now() - (query.state.dataUpdatedAt || 0);
        return dataAge > 1000 * 60 * 2; // Обновляем если старше 2 минут
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

  // Предзагружаем критические маршруты
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
              <RegionBlockingNotice />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
