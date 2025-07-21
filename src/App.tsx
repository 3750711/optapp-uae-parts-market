import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { OfferStateProvider } from '@/contexts/OfferStateContext';
import Home from './pages/Index';
import ProductPage from './pages/ProductDetail';
import ProfilePage from './pages/Profile';
import AdminPage from './pages/AdminDashboard';
import CatalogPage from './pages/Catalog';
import OrderPage from './pages/OrderDetails';
import ChatPage from './pages/NotFound'; // Using NotFound as placeholder
import NotFoundPage from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import Layout from './components/layout/Layout';

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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfferStateProvider>
            <BrowserRouter>
              <Layout>
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
                <Toaster />
              </Layout>
            </BrowserRouter>
          </OfferStateProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;