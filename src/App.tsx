

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegister from "./pages/SellerRegister";
import Profile from "./pages/Profile";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import SellerAddProduct from "./pages/SellerAddProduct";
import SellerListings from "./pages/SellerListings";
import SellerOrders from "./pages/SellerOrders";
import BuyerOrders from "./pages/BuyerOrders";
import OrderDetails from "./pages/OrderDetails";
import SellerProfile from "./pages/SellerProfile";
import PublicSellerProfile from "./pages/PublicSellerProfile";
import CreateRequest from "./pages/CreateRequest";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import CreateStore from "./pages/CreateStore";
import Contact from "./pages/Contact";
import About from "./pages/About";
import BuyerGuide from "./pages/BuyerGuide";
import BuyerCreateOrder from "./pages/BuyerCreateOrder";
import SellerCreateOrder from "./pages/SellerCreateOrder";
import SellerSellProduct from "./pages/SellerSellProduct";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminStores from "./pages/AdminStores";
import AdminEvents from "./pages/AdminEvents";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminFreeOrder from "./pages/AdminFreeOrder";
import AdminCreateOrderFromProduct from "./pages/AdminCreateOrderFromProduct";
import AdminCarCatalog from "./pages/AdminCarCatalog";
import AdminLogistics from "./pages/AdminLogistics";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/seller-register" element={<SellerRegister />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/seller/add-product" element={<ProtectedRoute><SellerAddProduct /></ProtectedRoute>} />
              <Route path="/seller/listings" element={<ProtectedRoute><SellerListings /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
              {/* Изменяем маршрут с dashboard на profile */}
              <Route path="/seller/profile" element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />
              <Route path="/seller/dashboard" element={<Navigate to="/seller/profile" replace />} />
              <Route path="/seller/create-order" element={<ProtectedRoute><SellerCreateOrder /></ProtectedRoute>} />
              <Route path="/seller/sell-product" element={<ProtectedRoute><SellerSellProduct /></ProtectedRoute>} />
              {/* Публичный профиль продавца - это должно быть в конце, чтобы не конфликтовать */}
              <Route path="/seller/:id" element={<PublicSellerProfile />} />
              
              {/* Редирект с /orders на /buyer/orders */}
              <Route path="/orders" element={<Navigate to="/buyer/orders" replace />} />
              
              <Route path="/buyer/orders" element={<ProtectedRoute><BuyerOrders /></ProtectedRoute>} />
              <Route path="/buyer/create-order" element={<ProtectedRoute><BuyerCreateOrder /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/create-request" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
              <Route path="/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/store/:id" element={<StoreDetail />} />
              <Route path="/create-store" element={<ProtectedRoute><CreateStore /></ProtectedRoute>} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/buyer-guide" element={<BuyerGuide />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/admin/stores" element={<ProtectedRoute><AdminStores /></ProtectedRoute>} />
              <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
              <Route path="/admin/add-product" element={<ProtectedRoute><AdminAddProduct /></ProtectedRoute>} />
              <Route path="/admin/free-order" element={<ProtectedRoute><AdminFreeOrder /></ProtectedRoute>} />
              <Route path="/admin/create-order-from-product" element={<ProtectedRoute><AdminCreateOrderFromProduct /></ProtectedRoute>} />
              <Route path="/admin/car-catalog" element={<ProtectedRoute><AdminCarCatalog /></ProtectedRoute>} />
              <Route path="/admin/logistics" element={<ProtectedRoute><AdminLogistics /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
