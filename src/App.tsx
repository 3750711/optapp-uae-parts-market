
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Import optimized routes
import { routes, preloadCriticalRoutes } from '@/utils/lazyRoutes';

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

// Мемоизированный компонент загрузки
const LoadingFallback = React.memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Загрузка...</p>
    </div>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

// Оптимизированный обработчик ошибок
const setupErrorHandling = () => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('unhandledrejection', (event) => {
    // Логируем только критические ошибки
    if (event.reason?.name !== 'ChunkLoadError') {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Аналитика только в продакшене
      if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', 'exception', {
          description: `Unhandled rejection: ${event.reason?.message || event.reason}`,
          fatal: false,
        });
      }
    }
    event.preventDefault();
  });
};

// Инициализируем обработку ошибок один раз
setupErrorHandling();

// Компонент маршрута с защитой от ошибок
const RouteComponent = React.memo(({ route, index }: { route: any; index: number }) => {
  const { path, element, protected: isProtected, adminOnly } = route;
  
  // Проверяем валидность элемента
  if (!element) {
    console.error(`Route "${path}" has undefined element at index ${index}`);
    return (
      <Route
        key={index}
        path={path}
        element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-600 mb-2">Ошибка загрузки страницы</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Обновить
              </button>
            </div>
          </div>
        }
      />
    );
  }
  
  if (adminOnly) {
    return (
      <Route
        key={index}
        path={path}
        element={
          <AdminRoute>
            {element}
          </AdminRoute>
        }
      />
    );
  }
  
  if (isProtected) {
    return (
      <Route
        key={index}
        path={path}
        element={
          <ProtectedRoute>
            {element}
          </ProtectedRoute>
        }
      />
    );
  }
  
  return (
    <Route
      key={index}
      path={path}
      element={element}
    />
  );
});

RouteComponent.displayName = 'RouteComponent';

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
                    {routes.map((route, index) => (
                      <RouteComponent key={route.path || index} route={route} index={index} />
                    ))}
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
