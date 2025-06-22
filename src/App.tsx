
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/SimpleAuthContext";
import { ProfileProvider } from "@/contexts/ProfileProvider";

import Index from "./pages/Index";
import SimpleLogin from "./pages/SimpleLogin";
import Register from "./pages/Register";
import SimpleProtectedRoute from "./components/auth/SimpleProtectedRoute";
import { SimpleAdminRoute } from "./components/auth/SimpleAdminRoute";

// Import other pages
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";

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
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<SimpleLogin />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <SimpleProtectedRoute>
                  <Profile />
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
