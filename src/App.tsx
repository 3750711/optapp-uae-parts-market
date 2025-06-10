import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./App.css";

// Используем оптимизированные компоненты
import { AuthProvider } from "@/contexts/OptimizedAuthContext";
import { OptimizedAdminRoute } from "@/components/auth/OptimizedAdminRoute";
import OptimizedProtectedRoute from "@/components/auth/OptimizedProtectedRoute";

// Импорты оптимизированных роутов
import {
  Index,
  ProductDetail,
  Catalog,
  Login,
  Register,
  LazyProfile,
  LazyBuyerOrders,
  LazySellerOrders,
  LazyAdminDashboard,
  LazyAdminUsers,
  LazyAdminProducts,
  LazyAdminOrders,
  LazyAbout,
  LazyContact,
  LazyStores,
  LazySellerDashboard,
  LazySellerListings,
  LazyCreateStore,
  AdminSuspenseWrapper
} from "@/utils/optimizedLazyRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут
      gcTime: 1000 * 60 * 10, // 10 минут
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('fetch')) {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Публичные страницы - без lazy loading */}
                <Route path="/" element={<Index />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Страницы с минимальной защитой */}
                <Route path="/about" element={<LazyAbout />} />
                <Route path="/contact" element={<LazyContact />} />
                <Route path="/stores" element={<LazyStores />} />

                {/* Защищенные страницы */}
                <Route
                  path="/profile"
                  element={
                    <OptimizedProtectedRoute>
                      <LazyProfile />
                    </OptimizedProtectedRoute>
                  }
                />

                <Route
                  path="/buyer/orders"
                  element={
                    <OptimizedProtectedRoute allowedRoles={['buyer', 'admin']}>
                      <LazyBuyerOrders />
                    </OptimizedProtectedRoute>
                  }
                />

                <Route
                  path="/seller/dashboard"
                  element={
                    <OptimizedProtectedRoute allowedRoles={['seller', 'admin']}>
                      <LazySellerDashboard />
                    </OptimizedProtectedRoute>
                  }
                />

                <Route
                  path="/seller/orders"
                  element={
                    <OptimizedProtectedRoute allowedRoles={['seller', 'admin']}>
                      <LazySellerOrders />
                    </OptimizedProtectedRoute>
                  }
                />

                <Route
                  path="/seller/listings"
                  element={
                    <OptimizedProtectedRoute allowedRoles={['seller', 'admin']}>
                      <LazySellerListings />
                    </OptimizedProtectedRoute>
                  }
                />

                <Route
                  path="/stores/create"
                  element={
                    <OptimizedProtectedRoute allowedRoles={['seller', 'admin']}>
                      <LazyCreateStore />
                    </OptimizedProtectedRoute>
                  }
                />

                {/* Админские маршруты */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <OptimizedAdminRoute>
                      <AdminSuspenseWrapper>
                        <LazyAdminDashboard />
                      </AdminSuspenseWrapper>
                    </OptimizedAdminRoute>
                  }
                />

                <Route
                  path="/admin/users"
                  element={
                    <OptimizedAdminRoute>
                      <AdminSuspenseWrapper>
                        <LazyAdminUsers />
                      </AdminSuspenseWrapper>
                    </OptimizedAdminRoute>
                  }
                />

                <Route
                  path="/admin/products"
                  element={
                    <OptimizedAdminRoute>
                      <AdminSuspenseWrapper>
                        <LazyAdminProducts />
                      </AdminSuspenseWrapper>
                    </OptimizedAdminRoute>
                  }
                />

                <Route
                  path="/admin/orders"
                  element={
                    <OptimizedAdminRoute>
                      <AdminSuspenseWrapper>
                        <LazyAdminOrders />
                      </AdminSuspenseWrapper>
                    </OptimizedAdminRoute>
                  }
                />

                <Route path="*" element={<div>Страница не найдена</div>} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
