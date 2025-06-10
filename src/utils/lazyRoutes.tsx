import { lazy } from 'react';
import { devError, devLog } from '@/utils/performanceUtils';

// Improved lazy loading with better chunk error handling
const lazyWithRetry = (importFunc: () => Promise<any>) => {
  return lazy(() => {
    const attemptImport = (): Promise<any> => {
      return importFunc().catch((error) => {
        devError('Failed to load module:', error);
        
        // Check if it's a chunk load error
        const isChunkLoadError = error.message.includes('loading dynamically imported module') ||
                                error.message.includes('Failed to fetch dynamically imported module') ||
                                error.message.includes('Loading chunk') ||
                                error.name === 'ChunkLoadError';
        
        if (isChunkLoadError) {
          devLog('Chunk load error detected, clearing cache and reloading...');
          
          // Clear cache and reload for chunk errors
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          
          // Force reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 100);
          
          // Return a fallback component while reloading
          return Promise.resolve({
            default: () => (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Обновление приложения...</p>
                </div>
              </div>
            )
          });
        }
        
        // For other errors, throw to be handled by error boundary
        throw error;
      });
    };
    
    return attemptImport();
  });
};

// Regular pages with improved error handling
const Index = lazyWithRetry(() => import('@/pages/Index'));
const About = lazyWithRetry(() => import('@/pages/About'));
const Contact = lazyWithRetry(() => import('@/pages/Contact'));
const Catalog = lazyWithRetry(() => import('@/pages/Catalog'));
const ProductDetail = lazyWithRetry(() => import('@/pages/ProductDetail'));
const Login = lazyWithRetry(() => import('@/pages/Login'));
const Register = lazyWithRetry(() => import('@/pages/Register'));
const SellerRegister = lazyWithRetry(() => import('@/pages/SellerRegister'));
const ForgotPassword = lazyWithRetry(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazyWithRetry(() => import('@/pages/VerifyEmail'));
const Profile = lazyWithRetry(() => import('@/pages/Profile'));
const SellerDashboard = lazyWithRetry(() => import('@/pages/SellerDashboard'));
const SellerListings = lazyWithRetry(() => import('@/pages/SellerListings'));
const SellerAddProduct = lazyWithRetry(() => import('@/pages/SellerAddProduct'));
const SellerCreateOrder = lazyWithRetry(() => import('@/pages/SellerCreateOrder'));
const SellerOrders = lazyWithRetry(() => import('@/pages/SellerOrders'));
const SellerOrderDetails = lazyWithRetry(() => import('@/pages/SellerOrderDetails'));
const SellerSellProduct = lazyWithRetry(() => import('@/pages/SellerSellProduct'));
const SellerProfile = lazyWithRetry(() => import('@/pages/SellerProfile'));
const PublicSellerProfile = lazyWithRetry(() => import('@/pages/PublicSellerProfile'));
const BuyerCreateOrder = lazyWithRetry(() => import('@/pages/BuyerCreateOrder'));
const BuyerOrders = lazyWithRetry(() => import('@/pages/BuyerOrders'));
const BuyerGuide = lazyWithRetry(() => import('@/pages/BuyerGuide'));
const Stores = lazyWithRetry(() => import('@/pages/Stores'));
const StoreDetail = lazyWithRetry(() => import('@/pages/StoreDetail'));
const CreateStore = lazyWithRetry(() => import('@/pages/CreateStore'));
const Requests = lazyWithRetry(() => import('@/pages/Requests'));
const CreateRequest = lazyWithRetry(() => import('@/pages/CreateRequest'));
const RequestDetail = lazyWithRetry(() => import('@/pages/RequestDetail'));
const NotFound = lazyWithRetry(() => import('@/pages/NotFound'));
const OrdersRedirect = lazyWithRetry(() => import('@/pages/OrdersRedirect'));
const OrderDetails = lazyWithRetry(() => import('@/pages/OrderDetails'));

// Admin pages with same improved error handling
const AdminDashboard = lazyWithRetry(() => import('@/pages/AdminDashboard'));
const AdminUsers = lazyWithRetry(() => import('@/pages/AdminUsers'));
const AdminProducts = lazyWithRetry(() => import('@/pages/AdminProducts'));
const AdminAddProduct = lazyWithRetry(() => import('@/pages/AdminAddProduct'));
const AdminOrders = lazyWithRetry(() => import('@/pages/AdminOrders'));
const AdminOrderDetails = lazyWithRetry(() => import('@/pages/AdminOrderDetails'));
const AdminFreeOrder = lazyWithRetry(() => import('@/pages/AdminFreeOrder'));
const AdminCreateOrderFromProduct = lazyWithRetry(() => import('@/pages/AdminCreateOrderFromProduct'));
const AdminStores = lazyWithRetry(() => import('@/pages/AdminStores'));
const AdminCarCatalog = lazyWithRetry(() => import('@/pages/AdminCarCatalog'));
const AdminLogistics = lazyWithRetry(() => import('@/pages/AdminLogistics'));
const AdminEvents = lazyWithRetry(() => import('@/pages/AdminEvents'));
const GenerateOGImage = lazyWithRetry(() => import('@/pages/GenerateOGImage'));

export const routes = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/catalog",
    element: <Catalog />,
  },
  {
    path: "/product/:id",
    element: <ProductDetail />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/seller/register",
    element: <SellerRegister />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
  {
    path: "/profile",
    element: <Profile />,
    protected: true,
  },
  {
    path: "/seller/dashboard",
    element: <SellerDashboard />,
    protected: true,
  },
  {
    path: "/seller/listings",
    element: <SellerListings />,
    protected: true,
  },
  {
    path: "/seller/add-product",
    element: <SellerAddProduct />,
    protected: true,
  },
  {
    path: "/seller/create-order",
    element: <SellerCreateOrder />,
    protected: true,
  },
  {
    path: "/seller/orders",
    element: <SellerOrders />,
    protected: true,
  },
  {
    path: "/seller/orders/:id",
    element: <SellerOrderDetails />,
    protected: true,
  },
  {
    path: "/seller/sell-product/:id",
    element: <SellerSellProduct />,
    protected: true,
  },
  {
    path: "/seller/profile",
    element: <SellerProfile />,
    protected: true,
  },
  {
    path: "/seller/:id",
    element: <PublicSellerProfile />,
  },
  {
    path: "/buyer/create-order",
    element: <BuyerCreateOrder />,
    protected: true,
  },
  {
    path: "/buyer/orders",
    element: <BuyerOrders />,
    protected: true,
  },
  {
    path: "/buyer/guide",
    element: <BuyerGuide />,
  },
  {
    path: "/stores",
    element: <Stores />,
  },
  {
    path: "/store/:id",
    element: <StoreDetail />,
  },
  {
    path: "/create-store",
    element: <CreateStore />,
    protected: true,
  },
  {
    path: "/requests",
    element: <Requests />,
  },
  {
    path: "/create-request",
    element: <CreateRequest />,
    protected: true,
  },
  {
    path: "/request/:id",
    element: <RequestDetail />,
  },
  {
    path: "/orders",
    element: <OrdersRedirect />,
    protected: true,
  },
  {
    path: "/order/:id",
    element: <OrderDetails />,
  },
  // Admin routes
  {
    path: "/admin",
    element: <AdminDashboard />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/users",
    element: <AdminUsers />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/products",
    element: <AdminProducts />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/add-product",
    element: <AdminAddProduct />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders",
    element: <AdminOrders />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders/:id",
    element: <AdminOrderDetails />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/free-order",
    element: <AdminFreeOrder />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order-from-product",
    element: <AdminCreateOrderFromProduct />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order/:productId",
    element: <AdminCreateOrderFromProduct />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/stores",
    element: <AdminStores />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/car-catalog",
    element: <AdminCarCatalog />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/logistics",
    element: <AdminLogistics />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/events",
    element: <AdminEvents />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "/generate-og-image",
    element: <GenerateOGImage />,
    protected: true,
    adminOnly: true,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
