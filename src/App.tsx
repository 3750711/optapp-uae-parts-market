
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

// Create a client with improved error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
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

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent default browser behavior
  event.preventDefault();
  
  // Log to analytics if available
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
                              <GlobalErrorBoundary isAdminRoute={true}>
                                <AdminRoute>
                                  {element}
                                </AdminRoute>
                              </GlobalErrorBoundary>
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
                              <GlobalErrorBoundary>
                                <ProtectedRoute>
                                  {element}
                                </ProtectedRoute>
                              </GlobalErrorBoundary>
                            }
                          />
                        );
                      }
                      
                      return (
                        <Route
                          key={index}
                          path={path}
                          element={
                            <GlobalErrorBoundary>
                              {element}
                            </GlobalErrorBoundary>
                          }
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
