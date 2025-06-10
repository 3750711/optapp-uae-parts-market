
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Import simplified route configs
import { routeConfigs, preloadCriticalRoutes } from '@/utils/lazyRoutes';

// Оптимизированная конфигурация React Query
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут для стабильных данных
      gcTime: 1000 * 60 * 30, // 30 минут для кэша
      retry: (failureCount, error: any) => {
        // Умная логика повторов
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Используем кэш при монтировании
      refetchOnReconnect: true, // Обновляем при восстановлении соединения
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Простой компонент загрузки
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

  // Предзагружаем критические маршруты после инициализации
  React.useEffect(() => {
    preloadCriticalRoutes();
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
                    {routeConfigs.map((route, index) => {
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
