import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CatalogPage from './pages/CatalogPage';
import OrderPage from './pages/OrderPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import { Toaster } from 'sonner';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { useAdminAccess } from './hooks/useAdminAccess';
import { OfferStateProvider } from '@/contexts/OfferStateContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfferStateProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <SiteHeader />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/product/:productId" element={<ProductPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/order/:orderId" element={<OrderPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <SiteFooter />
              <Toaster />
            </div>
          </BrowserRouter>
        </OfferStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
