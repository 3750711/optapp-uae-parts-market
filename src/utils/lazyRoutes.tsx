
import { lazy } from 'react';

// Простой стандартный lazy loading без дополнительной обработки ошибок
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Profile = lazy(() => import('@/pages/Profile'));
const SellerRegister = lazy(() => import('@/pages/SellerRegister'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const SellerListings = lazy(() => import('@/pages/SellerListings'));
const SellerAddProduct = lazy(() => import('@/pages/SellerAddProduct'));
const SellerCreateOrder = lazy(() => import('@/pages/SellerCreateOrder'));
const SellerOrders = lazy(() => import('@/pages/SellerOrders'));
const SellerOrderDetails = lazy(() => import('@/pages/SellerOrderDetails'));
const SellerSellProduct = lazy(() => import('@/pages/SellerSellProduct'));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const PublicSellerProfile = lazy(() => import('@/pages/PublicSellerProfile'));
const BuyerCreateOrder = lazy(() => import('@/pages/BuyerCreateOrder'));
const BuyerOrders = lazy(() => import('@/pages/BuyerOrders'));
const BuyerGuide = lazy(() => import('@/pages/BuyerGuide'));
const Stores = lazy(() => import('@/pages/Stores'));
const StoreDetail = lazy(() => import('@/pages/StoreDetail'));
const CreateStore = lazy(() => import('@/pages/CreateStore'));
const Requests = lazy(() => import('@/pages/Requests'));
const CreateRequest = lazy(() => import('@/pages/CreateRequest'));
const RequestDetail = lazy(() => import('@/pages/RequestDetail'));
const OrdersRedirect = lazy(() => import('@/pages/OrdersRedirect'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminProducts = lazy(() => import('@/pages/AdminProducts'));
const AdminAddProduct = lazy(() => import('@/pages/AdminAddProduct'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminOrderDetails = lazy(() => import('@/pages/AdminOrderDetails'));
const AdminFreeOrder = lazy(() => import('@/pages/AdminFreeOrder'));
const AdminCreateOrderFromProduct = lazy(() => import('@/pages/AdminCreateOrderFromProduct'));
const AdminStores = lazy(() => import('@/pages/AdminStores'));
const AdminCarCatalog = lazy(() => import('@/pages/AdminCarCatalog'));
const AdminLogistics = lazy(() => import('@/pages/AdminLogistics'));
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const GenerateOGImage = lazy(() => import('@/pages/GenerateOGImage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Простая конфигурация маршрутов без pre-created элементов
export const routeConfigs = [
  // Критические маршруты
  { path: "/", component: Index },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/catalog", component: Catalog },
  
  // Основные маршруты
  { path: "/about", component: About },
  { path: "/contact", component: Contact },
  { path: "/product/:id", component: ProductDetail },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/reset-password", component: ResetPassword },
  { path: "/verify-email", component: VerifyEmail },
  { path: "/profile", component: Profile, protected: true },
  
  // Продавцы
  { path: "/seller/register", component: SellerRegister },
  { path: "/seller/dashboard", component: SellerDashboard, protected: true },
  { path: "/seller/listings", component: SellerListings, protected: true },
  { path: "/seller/add-product", component: SellerAddProduct, protected: true },
  { path: "/seller/create-order", component: SellerCreateOrder, protected: true },
  { path: "/seller/orders", component: SellerOrders, protected: true },
  { path: "/seller/orders/:id", component: SellerOrderDetails, protected: true },
  { path: "/seller/sell-product/:id", component: SellerSellProduct, protected: true },
  { path: "/seller/profile", component: SellerProfile, protected: true },
  { path: "/seller/:id", component: PublicSellerProfile },
  
  // Покупатели
  { path: "/buyer/create-order", component: BuyerCreateOrder, protected: true },
  { path: "/buyer/orders", component: BuyerOrders, protected: true },
  { path: "/buyer/guide", component: BuyerGuide },
  
  // Магазины
  { path: "/stores", component: Stores },
  { path: "/store/:id", component: StoreDetail },
  { path: "/create-store", component: CreateStore, protected: true },
  
  // Заявки
  { path: "/requests", component: Requests },
  { path: "/create-request", component: CreateRequest, protected: true },
  { path: "/request/:id", component: RequestDetail },
  
  // Заказы
  { path: "/orders", component: OrdersRedirect, protected: true },
  { path: "/order/:id", component: OrderDetails },
  
  // Админ маршруты
  { path: "/admin", component: AdminDashboard, protected: true, adminOnly: true },
  { path: "/admin/dashboard", component: AdminDashboard, protected: true, adminOnly: true },
  { path: "/admin/users", component: AdminUsers, protected: true, adminOnly: true },
  { path: "/admin/products", component: AdminProducts, protected: true, adminOnly: true },
  { path: "/admin/add-product", component: AdminAddProduct, protected: true, adminOnly: true },
  { path: "/admin/orders", component: AdminOrders, protected: true, adminOnly: true },
  { path: "/admin/orders/:id", component: AdminOrderDetails, protected: true, adminOnly: true },
  { path: "/admin/free-order", component: AdminFreeOrder, protected: true, adminOnly: true },
  { path: "/admin/create-order-from-product", component: AdminCreateOrderFromProduct, protected: true, adminOnly: true },
  { path: "/admin/create-order/:productId", component: AdminCreateOrderFromProduct, protected: true, adminOnly: true },
  { path: "/admin/stores", component: AdminStores, protected: true, adminOnly: true },
  { path: "/admin/car-catalog", component: AdminCarCatalog, protected: true, adminOnly: true },
  { path: "/admin/logistics", component: AdminLogistics, protected: true, adminOnly: true },
  { path: "/admin/events", component: AdminEvents, protected: true, adminOnly: true },
  { path: "/generate-og-image", component: GenerateOGImage, protected: true, adminOnly: true },
  
  // 404
  { path: "*", component: NotFound },
];

// Простая функция предзагрузки критических компонентов
export const preloadCriticalRoutes = () => {
  // Предзагружаем дополнительные компоненты через 2 секунды
  setTimeout(() => {
    import('@/pages/About');
    import('@/pages/Contact');
    import('@/pages/ProductDetail');
  }, 2000);
  
  // Предзагружаем больше компонентов через 5 секунд
  setTimeout(() => {
    import('@/pages/Profile');
    import('@/pages/Stores');
  }, 5000);
};
