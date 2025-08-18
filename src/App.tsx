
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "@/routes";
import { Loader2 } from "lucide-react";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import ProfileCompletionRedirect from "@/components/routing/ProfileCompletionRedirect";

// Оптимизированная конфигурация QueryClient для production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем при авторизационных ошибках
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 2; // Уменьшено количество повторов
      },
      staleTime: 5 * 60 * 1000, // Уменьшено до 5 минут для более актуальных данных о предложениях
      gcTime: 30 * 60 * 1000, // 30 минут в памяти
      refetchOnWindowFocus: false, // Отключено для производительности
      refetchOnMount: true, // Включено для получения актуальных данных о предложениях
    },
    mutations: {
      retry: false, // Не повторяем мутации автоматически
    }
  },
});

// Компонент загрузки для lazy-loaded маршрутов
const RouteLoader = React.memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow mx-auto" />
      <p className="text-sm text-gray-600">Загрузка...</p>
    </div>
  </div>
));

// Create a separate component for the app content to ensure proper hook context
const AppContent: React.FC = () => {
  // Now useEffect is safely inside a React component
  React.useEffect(() => {
    try {
      // Initialize performance monitoring in development
      if (import.meta.env.DEV) {
        console.log('App initialized in development mode');
      }

      // Cleanup function
      return () => {
        try {
          // Any cleanup logic here
          console.log('App cleanup completed');
        } catch (error) {
          console.warn('Failed to cleanup App:', error);
        }
      };
    } catch (error) {
      console.warn('Failed to initialize App useEffect:', error);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ProfileCompletionRedirect>
                <Suspense fallback={<RouteLoader />}>
                  <AppRoutes />
                </Suspense>
              </ProfileCompletionRedirect>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
      <AppContent />
    </GlobalErrorBoundary>
  );
};

export default App;
