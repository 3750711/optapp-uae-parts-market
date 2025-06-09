
import { createRoot } from 'react-dom/client'
import './index.css'
import { ToastProvider } from "@/hooks/use-toast"
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Catalog from "./pages/Catalog";
import Stores from "./pages/Stores";
import CreateStore from "./pages/CreateStore";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProductDetail from "./pages/ProductDetail";
import StoreDetail from "./pages/StoreDetail";
import BuyerGuide from "./pages/BuyerGuide";
import AdminStores from "./pages/AdminStores";
import PublicSellerProfile from "./pages/PublicSellerProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SellerDashboard from "./pages/SellerDashboard";

// Create a client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once
      retryDelay: 500, // Wait 500ms before retrying
      staleTime: 180000, // Data remains fresh for 3 minutes
      gcTime: 300000, // Unused data is garbage collected after 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <GlobalErrorBoundary>
                  <div className="min-h-screen bg-white">
                    <Helmet>
                      <title>PartsBay.ae - Автозапчасти из ОАЭ</title>
                      <meta name="description" content="Купить автозапчасти из ОАЭ с доставкой по всему миру. Качественные запчасти для всех марок автомобилей." />
                    </Helmet>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/stores" element={<Stores />} />
                      <Route path="/stores/create" element={<CreateStore />} />
                      <Route path="/stores/:id" element={<StoreDetail />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/buyer-guide" element={<BuyerGuide />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/seller/:id" element={<PublicSellerProfile />} />
                      <Route path="/seller/dashboard" element={<SellerDashboard />} />
                      <Route path="/admin/stores" element={<AdminStores />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </GlobalErrorBoundary>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
