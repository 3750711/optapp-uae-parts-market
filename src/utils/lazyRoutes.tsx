
import { lazy } from 'react';

// Критические маршруты (загружаются сразу)
const HomePage = lazy(() => import('@/pages/Index'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const CatalogPage = lazy(() => import('@/pages/Catalog'));

// Защищенные маршруты
const Dashboard = lazy(() => import('@/pages/Profile'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetail'));

// Маршруты продавца
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const SellerCreateOrder = lazy(() => import('@/pages/SellerCreateOrder'));
const SellerProducts = lazy(() => import('@/pages/SellerListings'));
const SellerProductCreate = lazy(() => import('@/pages/SellerAddProduct'));
const SellerProductEdit = lazy(() => import('@/pages/SellerAddProduct'));
const SellerOrders = lazy(() => import('@/pages/SellerOrders'));

// Маршруты администратора
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminProducts = lazy(() => import('@/pages/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminOrderCreate = lazy(() => import('@/pages/AdminFreeOrder'));
const AdminCreateOrderFromProduct = lazy(() => import('@/pages/AdminCreateOrderFromProduct'));
const AdminOrderEdit = lazy(() => import('@/pages/AdminOrders'));
const AdminStores = lazy(() => import('@/pages/AdminStores'));

// Другие маршруты
const BuyerOrders = lazy(() => import('@/pages/BuyerOrders'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const routeConfigs = [
  // Публичные маршруты
  { path: '/', component: HomePage, protected: false },
  { path: '/login', component: LoginPage, protected: false },
  { path: '/register', component: RegisterPage, protected: false },
  { path: '/catalog', component: CatalogPage, protected: false },
  { path: '/catalog/:categorySlug', component: CatalogPage, protected: false },
  { path: '/products/:id', component: ProductDetailsPage, protected: false },
  { path: '/verify-email', component: VerifyEmail, protected: false },
  { path: '/reset-password', component: ResetPassword, protected: false },

  // Защищенные маршруты
  { path: '/dashboard', component: Dashboard, protected: true },
  { path: '/profile', component: Profile, protected: true },
  { path: '/orders/:id', component: OrderDetails, protected: true },

  // Маршруты продавца
  { path: '/seller/dashboard', component: SellerDashboard, protected: true },
  { path: '/seller/create-order', component: SellerCreateOrder, protected: true },
  { path: '/seller/products', component: SellerProducts, protected: true },
  { path: '/seller/products/create', component: SellerProductCreate, protected: true },
  { path: '/seller/products/:id/edit', component: SellerProductEdit, protected: true },
  { path: '/seller/orders', component: SellerOrders, protected: true },

  // Маршруты покупателя
  { path: '/buyer/orders', component: BuyerOrders, protected: true },

  // Маршруты администратора
  { path: '/admin', component: AdminDashboard, protected: true, adminOnly: true },
  { path: '/admin/dashboard', component: AdminDashboard, protected: true, adminOnly: true },
  { path: '/admin/users', component: AdminUsers, protected: true, adminOnly: true },
  { path: '/admin/products', component: AdminProducts, protected: true, adminOnly: true },
  { path: '/admin/orders', component: AdminOrders, protected: true, adminOnly: true },
  { path: '/admin/orders/create', component: AdminOrderCreate, protected: true, adminOnly: true },
  { path: '/admin/create-order-from-product', component: AdminCreateOrderFromProduct, protected: true, adminOnly: true },
  { path: '/admin/orders/:id/edit', component: AdminOrderEdit, protected: true, adminOnly: true },
  { path: '/admin/stores', component: AdminStores, protected: true, adminOnly: true },

  // 404 страница (должна быть последней)
  { path: '*', component: NotFound, protected: false }
];

// Функции предзагрузки
export const preloadCriticalRoutes = () => {
  // Предзагружаем критические маршруты
  import('@/pages/Index');
  import('@/pages/Login');
  import('@/pages/Catalog');
};

export const preloadAdminRoutes = () => {
  // Предзагружаем админские маршруты для быстрого доступа
  import('@/pages/AdminDashboard');
  import('@/pages/AdminUsers');
  import('@/pages/AdminProducts');
  import('@/pages/AdminOrders');
  import('@/pages/AdminCreateOrderFromProduct');
};

export const preloadSellerRoutes = () => {
  // Предзагружаем маршруты продавца
  import('@/pages/SellerDashboard');
  import('@/pages/SellerListings');
  import('@/pages/SellerOrders');
};
