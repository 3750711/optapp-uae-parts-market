
import { lazy } from 'react';

// Улучшенная функция создания lazy компонентов с обработкой ошибок
const createLazyComponent = (importFunc: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFunc();
      return module;
    } catch (error) {
      console.error(`Error loading ${componentName}:`, error);
      // Возвращаем fallback компонент при ошибке
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-2">
                Ошибка загрузки компонента
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Компонент {componentName} не удалось загрузить
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Перезагрузить страницу
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Критические компоненты - загружаются немедленно
const Index = createLazyComponent(() => import('@/pages/Index'), 'Index');
const Login = createLazyComponent(() => import('@/pages/Login'), 'Login');
const Register = createLazyComponent(() => import('@/pages/Register'), 'Register');
const Catalog = createLazyComponent(() => import('@/pages/Catalog'), 'Catalog');

// Основные компоненты
const About = createLazyComponent(() => import('@/pages/About'), 'About');
const Contact = createLazyComponent(() => import('@/pages/Contact'), 'Contact');
const ProductDetail = createLazyComponent(() => import('@/pages/ProductDetail'), 'ProductDetail');
const ForgotPassword = createLazyComponent(() => import('@/pages/ForgotPassword'), 'ForgotPassword');
const ResetPassword = createLazyComponent(() => import('@/pages/ResetPassword'), 'ResetPassword');
const VerifyEmail = createLazyComponent(() => import('@/pages/VerifyEmail'), 'VerifyEmail');
const Profile = createLazyComponent(() => import('@/pages/Profile'), 'Profile');

// Продавцы
const SellerRegister = createLazyComponent(() => import('@/pages/SellerRegister'), 'SellerRegister');
const SellerDashboard = createLazyComponent(() => import('@/pages/SellerDashboard'), 'SellerDashboard');
const SellerListings = createLazyComponent(() => import('@/pages/SellerListings'), 'SellerListings');
const SellerAddProduct = createLazyComponent(() => import('@/pages/SellerAddProduct'), 'SellerAddProduct');
const SellerCreateOrder = createLazyComponent(() => import('@/pages/SellerCreateOrder'), 'SellerCreateOrder');
const SellerOrders = createLazyComponent(() => import('@/pages/SellerOrders'), 'SellerOrders');
const SellerOrderDetails = createLazyComponent(() => import('@/pages/SellerOrderDetails'), 'SellerOrderDetails');
const SellerSellProduct = createLazyComponent(() => import('@/pages/SellerSellProduct'), 'SellerSellProduct');
const SellerProfile = createLazyComponent(() => import('@/pages/SellerProfile'), 'SellerProfile');
const PublicSellerProfile = createLazyComponent(() => import('@/pages/PublicSellerProfile'), 'PublicSellerProfile');

// Покупатели
const BuyerCreateOrder = createLazyComponent(() => import('@/pages/BuyerCreateOrder'), 'BuyerCreateOrder');
const BuyerOrders = createLazyComponent(() => import('@/pages/BuyerOrders'), 'BuyerOrders');
const BuyerGuide = createLazyComponent(() => import('@/pages/BuyerGuide'), 'BuyerGuide');

// Магазины
const Stores = createLazyComponent(() => import('@/pages/Stores'), 'Stores');
const StoreDetail = createLazyComponent(() => import('@/pages/StoreDetail'), 'StoreDetail');
const CreateStore = createLazyComponent(() => import('@/pages/CreateStore'), 'CreateStore');

// Заявки
const Requests = createLazyComponent(() => import('@/pages/Requests'), 'Requests');
const CreateRequest = createLazyComponent(() => import('@/pages/CreateRequest'), 'CreateRequest');
const RequestDetail = createLazyComponent(() => import('@/pages/RequestDetail'), 'RequestDetail');

// Заказы
const OrdersRedirect = createLazyComponent(() => import('@/pages/OrdersRedirect'), 'OrdersRedirect');
const OrderDetails = createLazyComponent(() => import('@/pages/OrderDetails'), 'OrderDetails');

// Админ компоненты - разделены для лучшего chunk splitting
const AdminDashboard = createLazyComponent(() => import('@/pages/AdminDashboard'), 'AdminDashboard');
const AdminUsers = createLazyComponent(() => import('@/pages/AdminUsers'), 'AdminUsers');
const AdminProducts = createLazyComponent(() => import('@/pages/AdminProducts'), 'AdminProducts');
const AdminAddProduct = createLazyComponent(() => import('@/pages/AdminAddProduct'), 'AdminAddProduct');
const AdminOrders = createLazyComponent(() => import('@/pages/AdminOrders'), 'AdminOrders');
const AdminOrderDetails = createLazyComponent(() => import('@/pages/AdminOrderDetails'), 'AdminOrderDetails');
const AdminFreeOrder = createLazyComponent(() => import('@/pages/AdminFreeOrder'), 'AdminFreeOrder');
const AdminCreateOrderFromProduct = createLazyComponent(() => import('@/pages/AdminCreateOrderFromProduct'), 'AdminCreateOrderFromProduct');
const AdminStores = createLazyComponent(() => import('@/pages/AdminStores'), 'AdminStores');
const AdminCarCatalog = createLazyComponent(() => import('@/pages/AdminCarCatalog'), 'AdminCarCatalog');
const AdminLogistics = createLazyComponent(() => import('@/pages/AdminLogistics'), 'AdminLogistics');
const AdminEvents = createLazyComponent(() => import('@/pages/AdminEvents'), 'AdminEvents');
const GenerateOGImage = createLazyComponent(() => import('@/pages/GenerateOGImage'), 'GenerateOGImage');

// 404
const NotFound = createLazyComponent(() => import('@/pages/NotFound'), 'NotFound');

// Конфигурация маршрутов без изменений
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

// Упрощенная функция предзагрузки - только для критически важных компонентов
export const preloadCriticalRoutes = () => {
  // Убираем автоматическую предзагрузку, чтобы избежать chunk loading errors
  console.log('🚀 Critical routes loaded, lazy loading other components on demand');
};
