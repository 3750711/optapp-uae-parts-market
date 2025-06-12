
import { lazy, ComponentType } from 'react';

// Retry механизм для загрузки чанков
const retryChunkLoad = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error?.name === 'ChunkLoadError') {
      console.warn(`Chunk load failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryChunkLoad(fn, retries - 1);
    }
    throw error;
  }
};

// Улучшенная функция создания lazy компонентов с retry и error handling
const createLazyComponent = (importFunc: () => Promise<any>, componentName: string, critical = false) => {
  return lazy(async () => {
    try {
      const startTime = performance.now();
      const module = await retryChunkLoad(importFunc);
      const endTime = performance.now();
      
      console.log(`📦 ${componentName} loaded in ${(endTime - startTime).toFixed(2)}ms`);
      return module;
    } catch (error) {
      console.error(`❌ Error loading ${componentName}:`, error);
      
      // Для критических компонентов возвращаем более простой fallback
      if (critical) {
        return {
          default: () => (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-center max-w-md p-6">
                <div className="text-lg font-medium text-gray-900 mb-4">
                  Ошибка загрузки
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Не удалось загрузить {componentName}. Это может быть связано с проблемами сети.
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Обновить страницу
                </button>
              </div>
            </div>
          )
        };
      }
      
      // Для некритических компонентов простой fallback
      return {
        default: () => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                Ошибка загрузки компонента {componentName}
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Обновить
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Критические компоненты - НЕ используют lazy loading
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Catalog from '@/pages/Catalog';

// Основные компоненты - lazy loading с retry
const About = createLazyComponent(() => import('@/pages/About'), 'About');
const Contact = createLazyComponent(() => import('@/pages/Contact'), 'Contact');
const ProductDetail = createLazyComponent(() => import('@/pages/ProductDetail'), 'ProductDetail');
const ForgotPassword = createLazyComponent(() => import('@/pages/ForgotPassword'), 'ForgotPassword');
const ResetPassword = createLazyComponent(() => import('@/pages/ResetPassword'), 'ResetPassword');
const VerifyEmail = createLazyComponent(() => import('@/pages/VerifyEmail'), 'VerifyEmail');
const Profile = createLazyComponent(() => import('@/pages/Profile'), 'Profile');

// Продавцы - группируем в отдельные чанки
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

// Админ компоненты - разделяем на мелкие чанки для лучшей производительности
const AdminDashboard = createLazyComponent(() => import('@/pages/AdminDashboard'), 'AdminDashboard', true);
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

// Конфигурация маршрутов - критические без lazy loading
export const routeConfigs = [
  // Критические маршруты (без lazy loading)
  { path: "/", component: Index },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/catalog", component: Catalog },
  
  // Основные маршруты (с lazy loading)
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
  
  // Админ маршруты (с улучшенным lazy loading)
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

// Улучшенная предзагрузка компонентов на основе пользователя
export const preloadCriticalRoutes = () => {
  console.log('🚀 Preloading critical components...');
  
  // Предзагрузка основных компонентов через 2 секунды после загрузки
  setTimeout(() => {
    import('@/pages/About');
    import('@/pages/Contact');
    import('@/pages/ProductDetail');
  }, 2000);
};

// Предзагрузка админ компонентов для админов
export const preloadAdminRoutes = () => {
  console.log('🔧 Preloading admin components...');
  
  // Предзагружаем админ компоненты с задержкой
  setTimeout(() => {
    import('@/pages/AdminUsers');
    import('@/pages/AdminProducts');
    import('@/pages/AdminOrders');
  }, 1000);
};

// Предзагрузка продавца компонентов
export const preloadSellerRoutes = () => {
  console.log('💼 Preloading seller components...');
  
  setTimeout(() => {
    import('@/pages/SellerDashboard');
    import('@/pages/SellerListings');
    import('@/pages/SellerOrders');
  }, 1000);
};
