import { lazy } from 'react';
import { devError, devLog } from '@/utils/performanceUtils';

// Utility function to add retry logic to lazy imports with optimized logging
const lazyWithRetry = (importFunc: () => Promise<any>, retries = 2) => { // Reduced retries
  return lazy(() => {
    const attemptImport = (attemptsLeft: number): Promise<any> => {
      return importFunc().catch((error) => {
        devError('Failed to load module:', error);
        
        if (attemptsLeft > 0) {
          devLog(`Retrying module load... (${attemptsLeft} attempts left)`);
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              attemptImport(attemptsLeft - 1)
                .then(resolve)
                .catch(reject);
            }, 500); // Reduced delay
          });
        }
        
        throw error;
      });
    };
    
    return attemptImport(retries);
  });
};

// Regular pages with reduced retry count
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

// Admin pages with standard retry count
const AdminDashboard = lazyWithRetry(() => import('@/pages/AdminDashboard'), 2);
const AdminUsers = lazyWithRetry(() => import('@/pages/AdminUsers'), 2);
const AdminProducts = lazyWithRetry(() => import('@/pages/AdminProducts'), 2);
const AdminAddProduct = lazyWithRetry(() => import('@/pages/AdminAddProduct'), 2);
const AdminOrders = lazyWithRetry(() => import('@/pages/AdminOrders'), 2);
const AdminOrderDetails = lazyWithRetry(() => import('@/pages/AdminOrderDetails'), 2);
const AdminFreeOrder = lazyWithRetry(() => import('@/pages/AdminFreeOrder'), 2);
const AdminCreateOrderFromProduct = lazyWithRetry(() => import('@/pages/AdminCreateOrderFromProduct'), 2);
const AdminStores = lazyWithRetry(() => import('@/pages/AdminStores'), 2);
const AdminCarCatalog = lazyWithRetry(() => import('@/pages/AdminCarCatalog'), 2);
const AdminLogistics = lazyWithRetry(() => import('@/pages/AdminLogistics'), 2);
const AdminEvents = lazyWithRetry(() => import('@/pages/AdminEvents'), 2);
const GenerateOGImage = lazyWithRetry(() => import('@/pages/GenerateOGImage'), 2);

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
