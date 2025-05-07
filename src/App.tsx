import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicSellerProfile from "@/pages/PublicSellerProfile";

// Import admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminLogistics from "./pages/AdminLogistics";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminOrders from "./pages/AdminOrders";
import AdminStores from "./pages/AdminStores";
import AdminCarCatalog from "./pages/AdminCarCatalog"; // Add import for new page

// Pages
import Catalog from "./pages/Catalog";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SellerProfile from "./pages/SellerProfile";
import SellerAddProduct from "./pages/SellerAddProduct";
import SellerCreateOrder from "./pages/SellerCreateOrder";
import Profile from "./pages/Profile";
import SellerOrders from "./pages/SellerOrders";
import OrderDetails from "./pages/OrderDetails";
import BuyerCreateOrder from "./pages/BuyerCreateOrder";
import BuyerOrders from "./pages/BuyerOrders";
import SellerListings from "./pages/SellerListings";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import CreateStore from "./pages/CreateStore";
import Requests from "./pages/Requests";
import CreateRequest from "./pages/CreateRequest";
import RequestDetail from "./pages/RequestDetail";

const App = () => {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/seller/dashboard" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerProfile />
                </ProtectedRoute>
              } />
              <Route path="/seller/add-product" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerAddProduct />
                </ProtectedRoute>
              } />
              <Route path="/seller/create-order" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerCreateOrder />
                </ProtectedRoute>
              } />
              <Route path="/seller/orders" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerOrders />
                </ProtectedRoute>
              } />
              <Route path="/seller/orders/:id" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <OrderDetails />
                </ProtectedRoute>
              } />
              <Route path="/seller/listings" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerListings />
                </ProtectedRoute>
              } />
              <Route path="/buyer/create-order" element={
                <ProtectedRoute>
                  <BuyerCreateOrder />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <BuyerOrders />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProducts />
                </ProtectedRoute>
              } />
              <Route path="/admin/add-product" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAddProduct />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOrders />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders/:id" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <OrderDetails />
                </ProtectedRoute>
              } />
              <Route path="/admin/logistics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLogistics />
                </ProtectedRoute>
              } />
              <Route path="/admin/stores" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminStores />
                </ProtectedRoute>
              } />
              <Route path="/admin/car-catalog" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCarCatalog />
                </ProtectedRoute>
              } />
              <Route path="/seller/:id" element={<PublicSellerProfile />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:id" element={<StoreDetail />} />
              <Route path="/stores/create" element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <CreateStore />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={<Requests />} />
              <Route path="/requests/create" element={<CreateRequest />} />
              <Route path="/requests/:id" element={<RequestDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
