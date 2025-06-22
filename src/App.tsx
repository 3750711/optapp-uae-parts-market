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
import HealthMonitor from "@/components/monitoring/HealthMonitor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем при авторизационных ошибках
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

// Компонент загрузки для lazy-loaded маршрутов
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
  </div>
);

const App = () => (
  <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<RouteLoader />}>
                <AppRoutes />
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
          <HealthMonitor showInProduction={false} />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </GlobalErrorBoundary>
);

export default App;
