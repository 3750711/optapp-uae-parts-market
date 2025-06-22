
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routeConfigs } from '@/utils/lazyRoutes';
import SimpleProtectedRoute from '@/components/auth/SimpleProtectedRoute';
import { SimpleAdminRoute } from '@/components/auth/SimpleAdminRoute';
import { Loader2 } from 'lucide-react';

// Fallback компонент для загрузки
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-optapp-yellow" />
      <p className="text-gray-600">Загрузка страницы...</p>
    </div>
  </div>
);

// ErrorBoundary для lazy loaded компонентов
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки страницы</h2>
            <p className="text-gray-600 mb-4">Произошла ошибка при загрузке этой страницы.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-optapp-yellow text-optapp-dark px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {routeConfigs.map((route) => {
        const Component = route.component;
        
        // Создаем элемент с правильной защитой
        let element: React.ReactNode;

        if (route.adminOnly) {
          // Админские маршруты
          element = (
            <SimpleAdminRoute>
              <RouteErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <Component />
                </Suspense>
              </RouteErrorBoundary>
            </SimpleAdminRoute>
          );
        } else if (route.protected) {
          // Защищенные маршруты
          element = (
            <SimpleProtectedRoute>
              <RouteErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <Component />
                </Suspense>
              </RouteErrorBoundary>
            </SimpleProtectedRoute>
          );
        } else {
          // Публичные маршруты
          element = (
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Component />
              </Suspense>
            </RouteErrorBoundary>
          );
        }

        return (
          <Route
            key={route.path}
            path={route.path}
            element={element}
          />
        );
      })}
    </Routes>
  );
};

export default AppRouter;
