
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminEvents from "./pages/AdminEvents";
import AdminCarCatalog from "./pages/AdminCarCatalog";
import AdminFreeOrder from "./pages/AdminFreeOrder";
import AdminCreateOrderFromProduct from "./pages/AdminCreateOrderFromProduct";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminLogistics from "./pages/AdminLogistics";
import PublicSellerProfile from "./pages/PublicSellerProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SellerDashboard from "./pages/SellerDashboard";
import SellerAddProduct from "./pages/SellerAddProduct";
import SellerListings from "./pages/SellerListings";
import SellerCreateOrder from "./pages/SellerCreateOrder";
import SellerSellProduct from "./pages/SellerSellProduct";
import SellerOrders from "./pages/SellerOrders";
import { AdminRoute } from "@/components/auth/AdminRoute";
import OrdersRedirect from "./pages/OrdersRedirect";
import Requests from "./pages/Requests";
import CreateRequest from "./pages/CreateRequest";
import RequestDetail from "./pages/RequestDetail";
import BuyerOrders from "./pages/BuyerOrders";
import OrderDetails from "./pages/OrderDetails";
import BuyerCreateOrder from "./pages/BuyerCreateOrder";

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
                      
                      {/* Orders redirect route */}
                      <Route path="/orders" element={<OrdersRedirect />} />
                      
                      {/* Requests routes */}
                      <Route path="/requests" element={<Requests />} />
                      <Route path="/requests/create" element={<CreateRequest />} />
                      <Route path="/requests/:id" element={<RequestDetail />} />
                      
                      {/* Buyer routes */}
                      <Route path="/buyer/orders" element={<BuyerOrders />} />
                      <Route path="/buyer/create-order" element={<BuyerCreateOrder />} />
                      
                      {/* Order details route */}
                      <Route path="/order/:id" element={<OrderDetails />} />
                      
                      {/* Seller routes */}
                      <Route path="/seller/dashboard" element={<SellerDashboard />} />
                      <Route path="/seller/add-product" element={<SellerAddProduct />} />
                      <Route path="/seller/listings" element={<SellerListings />} />
                      <Route path="/seller/create-order" element={<SellerCreateOrder />} />
                      <Route path="/seller/sell-product" element={<SellerSellProduct />} />
                      <Route path="/seller/orders" element={<SellerOrders />} />
                      <Route path="/seller/orders/:id" element={<OrderDetails />} />
                      
                      {/* Admin routes */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      } />
                      <Route path="/admin/add-product" element={
                        <AdminRoute>
                          <AdminAddProduct />
                        </AdminRoute>
                      } />
                      <Route path="/admin/events" element={
                        <AdminRoute>
                          <AdminEvents />
                        </AdminRoute>
                      } />
                      <Route path="/admin/car-catalog" element={
                        <AdminRoute>
                          <AdminCarCatalog />
                        </AdminRoute>
                      } />
                      <Route path="/admin/free-order" element={
                        <AdminRoute>
                          <AdminFreeOrder />
                        </AdminRoute>
                      } />
                      <Route path="/admin/create-order-from-product" element={
                        <AdminRoute>
                          <AdminCreateOrderFromProduct />
                        </AdminRoute>
                      } />
                      <Route path="/admin/orders" element={
                        <AdminRoute>
                          <AdminOrders />
                        </AdminRoute>
                      } />
                      <Route path="/admin/products" element={
                        <AdminRoute>
                          <AdminProducts />
                        </AdminRoute>
                      } />
                      <Route path="/admin/users" element={
                        <AdminRoute>
                          <AdminUsers />
                        </AdminRoute>
                      } />
                      <Route path="/admin/logistics" element={
                        <AdminRoute>
                          <AdminLogistics />
                        </AdminRoute>
                      } />
                      <Route path="/admin/stores" element={
                        <AdminRoute>
                          <AdminStores />
                        </AdminRoute>
                      } />
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
