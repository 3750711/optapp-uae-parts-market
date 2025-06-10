
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Import all lazy routes
import { routes } from '@/utils/lazyRoutes';

// Optimized React Query configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds instead of 5 minutes for faster UI
      gcTime: 1000 * 60 * 10, // 10 minutes instead of 30
      retry: 1, // Reduced from 3 for faster failure handling
      retryDelay: 1000, // Fixed 1 second delay instead of exponential
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: 'always', // Always refetch on mount for fresh data
    },
    mutations: {
      retry: 0, // No retries for mutations by default
      retryDelay: 500,
    },
  },
});

// Enhanced loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow mx-auto mb-4"></div>
      <p className="text-gray-600">Загрузка...</p>
    </div>
  </div>
);

// Only log critical unhandled rejections in production
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
  
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: `Unhandled promise rejection: ${event.reason}`,
      fatal: false,
    });
  }
});

function App() {
  return (
    <GlobalErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Router>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {routes.map((route, index) => {
                      const { path, element, protected: isProtected, adminOnly } = route;
                      
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
                    })}
                  </Routes>
                </Suspense>
              </Router>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
