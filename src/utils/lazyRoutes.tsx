
import { lazy } from 'react';

// Критические админ страницы - загружаем сразу без lazy
import AdminDashboard from '@/pages/AdminDashboard';
import OptimizedAdminAddProduct from '@/pages/OptimizedAdminAddProduct';

export const routeConfigs = [
  // Public routes
  {
    path: '/',
    component: lazy(() => import('@/pages/Index')),
    protected: false,
    adminOnly: false,
  },
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
  {
    path: '/buyer-guide',
    component: lazy(() => import('@/pages/BuyerGuide')),
    protected: false,
    adminOnly: false,
  },
  {
    path: '/seller-register',
    component: lazy(() => import('@/pages/SellerRegister')),
    protected: false,
    adminOnly: false,
  },
  
  // Admin routes - критические страницы без lazy loading
  {
    path: '/admin',
    component: AdminDashboard,
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/add-product',
    component: OptimizedAdminAddProduct,
    protected: true,
    adminOnly: true,
  },
  {
    path: '/admin/free-order',
    component: lazy(() => import('@/pages/AdminFreeOrder')),
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
    path: '/order-details/:id',
    component: lazy(() => import('@/pages/OrderDetails')),
    protected: true,
    adminOnly: false,
  },
  {
    path: '/orders',
    component: lazy(() => import('@/pages/OrdersRedirect')),
    protected: true,
    adminOnly: false,
  },
  
  // Seller routes
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
    path: '/seller/order/:id',
    component: lazy(() => import('@/pages/SellerOrderDetails')),
    protected: true,
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

// Обновленная функция предзагрузки для админ панели
export const preloadAdminRoutes = () => {
  console.log('🔄 Preloading admin routes...');
  
  // Предзагружаем только некритические админ страницы
  const adminRoutes = [
    () => import('@/pages/AdminUsers'),
    () => import('@/pages/AdminProducts'), 
    () => import('@/pages/AdminOrders'),
    () => import('@/pages/AdminStores'),
    () => import('@/pages/AdminEvents'),
    () => import('@/pages/AdminLogistics'),
    () => import('@/pages/AdminFreeOrder'),
  ];

  return Promise.allSettled(adminRoutes.map(route => route()));
};

// Предзагрузка критических маршрутов
export const preloadCriticalRoutes = () => {
  console.log('🔄 Preloading critical routes...');
  
  const criticalRoutes = [
    () => import('@/pages/Index'),
    () => import('@/pages/Login'),
    () => import('@/pages/Register'),
    () => import('@/pages/Catalog'),
    () => import('@/pages/Profile'),
  ];
  
  return Promise.allSettled(criticalRoutes.map(route => route()));
};

// Предзагрузка маршрутов продавца
export const preloadSellerRoutes = () => {
  console.log('🔄 Preloading seller routes...');
  
  const sellerRoutes = [
    () => import('@/pages/SellerDashboard'),
    () => import('@/pages/SellerListings'),
    () => import('@/pages/SellerAddProduct'),
    () => import('@/pages/SellerOrders'),
  ];
  
  return Promise.allSettled(sellerRoutes.map(route => route()));
};
