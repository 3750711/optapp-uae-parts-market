
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/SimpleAuthContext";
import { ProfileProvider } from "@/contexts/ProfileProvider";

import Index from "./pages/Index";
import SimpleLogin from "./pages/SimpleLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SimpleProtectedRoute from "./components/auth/SimpleProtectedRoute";
import { SimpleAdminRoute } from "./components/auth/SimpleAdminRoute";

// Import pages
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Catalog from "./pages/Catalog";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Stores from "./pages/Stores";
import Requests from "./pages/Requests";
import BuyerOrders from "./pages/BuyerOrders";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import OrdersRedirect from "./pages/OrdersRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/requests" element={<Requests />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<SimpleLogin />} />
              <Route path="/simple-login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <SimpleProtectedRoute>
                  <Profile />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <SimpleProtectedRoute>
                  <OrdersRedirect />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/buyer/orders" element={
                <SimpleProtectedRoute>
                  <BuyerOrders />
                </SimpleProtectedRoute>
              } />
              
              {/* Seller Routes */}
              <Route path="/seller" element={
                <SimpleProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboard />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/seller/dashboard" element={
                <SimpleProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboard />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/seller/profile" element={
                <SimpleProtectedRoute allowedRoles={['seller']}>
                  <SellerProfile />
                </SimpleProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <SimpleAdminRoute>
                  <AdminDashboard />
                </SimpleAdminRoute>
              } />
              <Route path="/admin/users" element={
                <SimpleAdminRoute>
                  <AdminUsers />
                </SimpleAdminRoute>
              } />
              <Route path="/admin/products" element={
                <SimpleAdminRoute>
                  <AdminProducts />
                </SimpleAdminRoute>
              } />
              <Route path="/admin/orders" element={
                <SimpleAdminRoute>
                  <AdminOrders />
                </SimpleAdminRoute>
              } />
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
