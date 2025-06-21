import { lazy } from 'react';

// Critical admin pages - load immediately without lazy loading
import AdminDashboard from '@/pages/AdminDashboard';
import AdminAddProduct from '@/pages/AdminAddProduct';

// OrdersRedirect component for handling order redirects
import OrdersRedirect from '@/pages/OrdersRedirect';

export const routeConfigs = [
  // Public routes
  {
    path: '/',
    component: lazy(() => import('@/pages/Index')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/about',
    component: lazy(() => import('@/pages/About')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/contact',
    component: lazy(() => import('@/pages/Contact')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/catalog',
    component: lazy(() => import('@/pages/Catalog')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/product/:id',
    component: lazy(() => import('@/pages/ProductDetail')),
    protected: false,
    adminOnly: false,
  },
  
  // Authentication routes
  {
    path: '/login',
    component: lazy(() => import('@/pages/Login')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/register',
    component: lazy(() => import('@/pages/Register')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/seller-register',
    component: lazy(() => import('@/pages/SellerRegister')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/forgot-password',
    component: lazy(() => import('@/pages/ForgotPassword')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/reset-password',
    component: lazy(() => import('@/pages/ResetPassword')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/verify-email',
    component: lazy(() => import('@/pages/VerifyEmail')),
    protected: false,
    adminOnly: false,
  },
  
  // Stores and requests routes
  {
    path: '/stores',
    component: lazy(() => import('@/pages/Stores')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/store/:id',
    component: lazy(() => import('@/pages/StoreDetail')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/create-store',
    component: lazy(() => import('@/pages/CreateStore')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/requests',
    component: lazy(() => import('@/pages/Requests')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/request/:id',
    component: lazy(() => import('@/pages/RequestDetail')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/create-request',
    component: lazy(() => import('@/pages/CreateRequest')),
    protected: true,
    adminOnly: false,
  },
  
  // Admin routes - critical pages without lazy loading
  {
    path: '/admin',
    component: AdminDashboard,
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/add-product',
    component: AdminAddProduct,
    protected: true,
    adminOnly: true,
  },
  
  // Admin routes with lazy loading
  {
    path: '/admin/users',
    component: lazy(() => import('@/pages/AdminUsers')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/products',
    component: lazy(() => import('@/pages/AdminProducts')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/orders',
    component: lazy(() => import('@/pages/AdminOrders')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/orders/:id',
    component: lazy(() => import('@/pages/AdminOrderDetails')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/free-order',
    component: lazy(() => import('@/pages/AdminFreeOrder')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/create-order-from-product',
    component: lazy(() => import('@/pages/AdminCreateOrderFromProduct')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/create-order-from-product/:id',
    component: lazy(() => import('@/pages/AdminCreateOrderFromProduct')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/stores',
    component: lazy(() => import('@/pages/AdminStores')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/events',
    component: lazy(() => import('@/pages/AdminEvents')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/logistics',
    component: lazy(() => import('@/pages/AdminLogistics')),
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/car-catalog',
    component: lazy(() => import('@/pages/AdminCarCatalog')),
    protected: true,
    adminOnly: true,
  },
  
  // User routes
  {
    path: '/profile',
    component: lazy(() => import('@/pages/Profile')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/buyer-orders',
    component: lazy(() => import('@/pages/BuyerOrders')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/buyer-create-order',
    component: lazy(() => import('@/pages/BuyerCreateOrder')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/order-details/:id',
    component: lazy(() => import('@/pages/OrderDetails')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/buyer-guide',
    component: lazy(() => import('@/pages/BuyerGuide')),
    protected: false,
    adminOnly: false,
  },
  
  // Seller routes
  {
    path: '/seller/dashboard',
    component: lazy(() => import('@/pages/SellerDashboard')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller',
    component: lazy(() => import('@/pages/SellerDashboard')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/listings',
    component: lazy(() => import('@/pages/SellerListings')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/add-product',
    component: lazy(() => import('@/pages/SellerAddProduct')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/orders',
    component: lazy(() => import('@/pages/SellerOrders')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/order-details/:id',
    component: lazy(() => import('@/pages/SellerOrderDetails')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/create-order',
    component: lazy(() => import('@/pages/SellerCreateOrder')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/sell-product',
    component: lazy(() => import('@/pages/SellerSellProduct')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/profile',
    component: lazy(() => import('@/pages/SellerProfile')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/public-seller-profile/:id',
    component: lazy(() => import('@/pages/PublicSellerProfile')),
    protected: false,
    adminOnly: false,
  },
  
  // Utility and redirect routes
  {
    path: '/orders',
    component: OrdersRedirect,
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller-create-order',
    component: () => {
      window.location.replace('/seller/create-order');
      return null;
    },
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller-sell-product',
    component: () => {
      window.location.replace('/seller/sell-product');
      return null;
    },
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller-profile',
    component: () => {
      window.location.replace('/seller/profile');
      return null;
    },
    protected: true,
    adminOnly: false,
  },
  {
    path: '/seller/products',
    component: () => {
      window.location.replace('/seller/listings');
      return null;
    },
    protected: true,
    adminOnly: false,
  },
  {
    path: '/generate-og-image',
    component: lazy(() => import('@/pages/GenerateOGImage')),
    protected: false,
    adminOnly: false,
  },
  
  // Error routes
  {
    path: '/404',
    component: lazy(() => import('@/pages/NotFound')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '*',
    component: lazy(() => import('@/pages/NotFound')),
    protected: false,
    adminOnly: false,
  },
];

// Preload admin routes
export const preloadAdminRoutes = () => {
  console.log('🔄 Preloading admin routes...');
  
  const adminRoutes = [
    () => import('@/pages/AdminUsers'),
    () => import('@/pages/AdminProducts'), 
    () => import('@/pages/AdminOrders'),
    () => import('@/pages/AdminOrderDetails'),
    () => import('@/pages/AdminFreeOrder'),
    () => import('@/pages/AdminCreateOrderFromProduct'),
    () => import('@/pages/AdminStores'),
    () => import('@/pages/AdminEvents'),
    () => import('@/pages/AdminLogistics'),
    () => import('@/pages/AdminCarCatalog'),
  ];

  return Promise.allSettled(adminRoutes.map(route => route()));
};

// Preload critical routes
export const preloadCriticalRoutes = () => {
  console.log('🔄 Preloading critical routes...');
  
  const criticalRoutes = [
    () => import('@/pages/Index'),
    () => import('@/pages/Login'),
    () => import('@/pages/Register'),
    () => import('@/pages/Catalog'),
    () => import('@/pages/Profile'),
    () => import('@/pages/ProductDetail'),
    () => import('@/pages/About'),
    () => import('@/pages/Contact'),
  ];
  
  return Promise.allSettled(criticalRoutes.map(route => route()));
};

// Preload seller routes
export const preloadSellerRoutes = () => {
  console.log('🔄 Preloading seller routes...');
  
  const sellerRoutes = [
    () => import('@/pages/SellerDashboard'),
    () => import('@/pages/SellerListings'),
    () => import('@/pages/SellerAddProduct'),
    () => import('@/pages/SellerOrders'),
    () => import('@/pages/SellerOrderDetails'),
    () => import('@/pages/SellerCreateOrder'),
    () => import('@/pages/SellerSellProduct'),
    () => import('@/pages/SellerProfile'),
    () => import('@/pages/PublicSellerProfile'),
  ];
  
  return Promise.allSettled(sellerRoutes.map(route => route()));
};

// Preload authentication routes
export const preloadAuthRoutes = () => {
  console.log('🔄 Preloading auth routes...');
  
  const authRoutes = [
    () => import('@/pages/Login'),
    () => import('@/pages/Register'),
    () => import('@/pages/SellerRegister'),
    () => import('@/pages/ForgotPassword'),
    () => import('@/pages/ResetPassword'),
    () => import('@/pages/VerifyEmail'),
  ];
  
  return Promise.allSettled(authRoutes.map(route => route()));
};

// Preload store and request routes
export const preloadStoreRoutes = () => {
  console.log('🔄 Preloading store and request routes...');
  
  const storeRoutes = [
    () => import('@/pages/Stores'),
    () => import('@/pages/StoreDetail'),
    () => import('@/pages/CreateStore'),
    () => import('@/pages/Requests'),
    () => import('@/pages/RequestDetail'),
    () => import('@/pages/CreateRequest'),
  ];
  
  return Promise.allSettled(storeRoutes.map(route => route()));
};
