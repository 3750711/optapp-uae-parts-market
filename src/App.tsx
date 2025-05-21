import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  LazyCatalog,
  LazyProductDetail,
  LazyAdminDashboard,
  LazyAdminProducts,
  LazyAdminOrders,
  LazyAdminUsers,
  LazyAdminEvents,
  LazyAdminStores,
  LazyAdminCarCatalog,
  LazyAdminLogistics,
  LazyAdminAddProduct,
  LazyAdminImageOptimizer,
  LazySellerRegister,
  LazyPublicSellerProfile,
  LazyAdminFreeOrder,
  LazyIndex
} from "@/utils/lazyRoutes";

// Import admin pages that don't use lazy loading
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminLogistics from "./pages/AdminLogistics";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminOrders from "./pages/AdminOrders";
import AdminStores from "./pages/AdminStores";
import AdminEvents from "./pages/AdminEvents";
import AdminImageOptimizer from "./pages/AdminImageOptimizer"; 
import AdminCarCatalog from "./pages/AdminCarCatalog";
import AdminFreeOrder from "./pages/AdminFreeOrder";

// Pages that don't use lazy loading
import NotFound from "./pages/NotFound";
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
import BuyerGuide from "./pages/BuyerGuide";

const App = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LazyIndex />} />
            <Route path="/catalog" element={<LazyCatalog />} />
            <Route path="/product/:id" element={<LazyProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/buyer-guide" element={<BuyerGuide />} />
            <Route path="/seller-register" element={<LazySellerRegister />} />
            
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
            {/* Admin routes with correct path structure */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/add-product" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminAddProduct />
              </ProtectedRoute>
            } />
            <Route path="/admin/free-order" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFreeOrder />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/admin/logistics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminLogistics />
              </ProtectedRoute>
            } />
            <Route path="/admin/stores" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminStores />
              </ProtectedRoute>
            } />
            <Route path="/admin/events" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminEvents />
              </ProtectedRoute>
            } />
            <Route path="/admin/image-optimizer" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminImageOptimizer />
              </ProtectedRoute>
            } />
            <Route path="/admin/car-catalog" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LazyAdminCarCatalog />
              </ProtectedRoute>
            } />
            <Route path="/seller/:id" element={<LazyPublicSellerProfile />} />
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
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
