
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Helmet, HelmetProvider } from "react-helmet-async";
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

const App = () => (
  <HelmetProvider>
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
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </GlobalErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;
