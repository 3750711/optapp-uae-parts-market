import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Helmet, HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import CreateOrder from "./pages/CreateOrder";
import EditOrder from "./pages/EditOrder";
import Users from "./pages/Users";
import Stores from "./pages/Stores";
import StoreDetails from "./pages/StoreDetails";
import CreateStore from "./pages/CreateStore";
import EditStore from "./pages/EditStore";
import Requests from "./pages/Requests";
import RequestDetails from "./pages/RequestDetails";
import CreateRequest from "./pages/CreateRequest";
import EditRequest from "./pages/EditRequest";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-white">
              <Helmet>
                <title>PartsBay.ae - Автозапчасти из ОАЭ</title>
                <meta name="description" content="Купить автозапчасти из ОАЭ с доставкой по всему миру. Качественные запчасти для всех марок автомобилей." />
              </Helmet>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/products/create" element={<CreateProduct />} />
                <Route path="/products/edit/:id" element={<EditProduct />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/orders/create" element={<CreateOrder />} />
                <Route path="/orders/edit/:id" element={<EditOrder />} />
                <Route path="/users" element={<Users />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/stores/:id" element={<StoreDetails />} />
                <Route path="/stores/create" element={<CreateStore />} />
                <Route path="/stores/edit/:id" element={<EditStore />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/:id" element={<RequestDetails />} />
                <Route path="/requests/create" element={<CreateRequest />} />
                <Route path="/requests/edit/:id" element={<EditRequest />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
