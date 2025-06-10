
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Import all lazy routes
import { routes } from '@/utils/lazyRoutes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-optapp-yellow"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
