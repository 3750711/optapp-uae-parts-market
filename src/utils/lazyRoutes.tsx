import { lazy, ComponentType } from 'react';
import { devError, devLog } from '@/utils/performanceUtils';

// Простой fallback без излишеств
const ChunkErrorFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">Загрузка...</p>
    </div>
  </div>
);

// Улучшенная функция lazy загрузки с простым retry
const createLazyComponent = (importFunc: () => Promise<any>, maxRetries = 2) => {
  return lazy(() => {
    let retryCount = 0;
    
    const attemptImport = async (): Promise<any> => {
      try {
        return await importFunc();
      } catch (error: any) {
        retryCount++;
        
        const isChunkError = error.name === 'ChunkLoadError' || 
                           error.message?.includes('Loading chunk') ||
                           error.message?.includes('dynamically imported module');
        
        if (isChunkError && retryCount <= maxRetries) {
          devLog(`Chunk load failed, retry ${retryCount}/${maxRetries}`);
          // Простая задержка перед повтором
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptImport();
        }
        
        devError('Failed to load module after retries:', error);
        
        // Возвращаем fallback вместо перезагрузки страницы
        return { default: ChunkErrorFallback };
      }
    };
    
    return attemptImport();
  });
};

// Группировка маршрутов по приоритету загрузки
// Критические компоненты (загружаются первыми)
const criticalComponents = {
  Index: () => createLazyComponent(() => import('@/pages/Index')),
  Login: () => createLazyComponent(() => import('@/pages/Login')),
  Register: () => createLazyComponent(() => import('@/pages/Register')),
  NotFound: () => createLazyComponent(() => import('@/pages/NotFound')),
  Catalog: () => createLazyComponent(() => import('@/pages/Catalog')),
};

// Основные компоненты (загружаются по требованию)
const mainComponents = {
  About: () => createLazyComponent(() => import('@/pages/About')),
  Contact: () => createLazyComponent(() => import('@/pages/Contact')),
  ProductDetail: () => createLazyComponent(() => import('@/pages/ProductDetail')),
  Profile: () => createLazyComponent(() => import('@/pages/Profile')),
  ForgotPassword: () => createLazyComponent(() => import('@/pages/ForgotPassword')),
  ResetPassword: () => createLazyComponent(() => import('@/pages/ResetPassword')),
  VerifyEmail: () => createLazyComponent(() => import('@/pages/VerifyEmail')),
};

// Продавцы (загружаются только когда нужны)
const sellerComponents = {
  SellerRegister: () => createLazyComponent(() => import('@/pages/SellerRegister')),
  SellerDashboard: () => createLazyComponent(() => import('@/pages/SellerDashboard')),
  SellerListings: () => createLazyComponent(() => import('@/pages/SellerListings')),
  SellerAddProduct: () => createLazyComponent(() => import('@/pages/SellerAddProduct')),
  SellerCreateOrder: () => createLazyComponent(() => import('@/pages/SellerCreateOrder')),
  SellerOrders: () => createLazyComponent(() => import('@/pages/SellerOrders')),
  SellerOrderDetails: () => createLazyComponent(() => import('@/pages/SellerOrderDetails')),
  SellerSellProduct: () => createLazyComponent(() => import('@/pages/SellerSellProduct')),
  SellerProfile: () => createLazyComponent(() => import('@/pages/SellerProfile')),
  PublicSellerProfile: () => createLazyComponent(() => import('@/pages/PublicSellerProfile')),
};

// Покупатели
const buyerComponents = {
  BuyerCreateOrder: () => createLazyComponent(() => import('@/pages/BuyerCreateOrder')),
  BuyerOrders: () => createLazyComponent(() => import('@/pages/BuyerOrders')),
  BuyerGuide: () => createLazyComponent(() => import('@/pages/BuyerGuide')),
};

// Магазины и заявки
const storeComponents = {
  Stores: () => createLazyComponent(() => import('@/pages/Stores')),
  StoreDetail: () => createLazyComponent(() => import('@/pages/StoreDetail')),
  CreateStore: () => createLazyComponent(() => import('@/pages/CreateStore')),
  Requests: () => createLazyComponent(() => import('@/pages/Requests')),
  CreateRequest: () => createLazyComponent(() => import('@/pages/CreateRequest')),
  RequestDetail: () => createLazyComponent(() => import('@/pages/RequestDetail')),
  OrdersRedirect: () => createLazyComponent(() => import('@/pages/OrdersRedirect')),
  OrderDetails: () => createLazyComponent(() => import('@/pages/OrderDetails')),
};

// Админ компоненты (загружаются только для админов)
const adminComponents = {
  AdminDashboard: () => createLazyComponent(() => import('@/pages/AdminDashboard')),
  AdminUsers: () => createLazyComponent(() => import('@/pages/AdminUsers')),
  AdminProducts: () => createLazyComponent(() => import('@/pages/AdminProducts')),
  AdminAddProduct: () => createLazyComponent(() => import('@/pages/AdminAddProduct')),
  AdminOrders: () => createLazyComponent(() => import('@/pages/AdminOrders')),
  AdminOrderDetails: () => createLazyComponent(() => import('@/pages/AdminOrderDetails')),
  AdminFreeOrder: () => createLazyComponent(() => import('@/pages/AdminFreeOrder')),
  AdminCreateOrderFromProduct: () => createLazyComponent(() => import('@/pages/AdminCreateOrderFromProduct')),
  AdminStores: () => createLazyComponent(() => import('@/pages/AdminStores')),
  AdminCarCatalog: () => createLazyComponent(() => import('@/pages/AdminCarCatalog')),
  AdminLogistics: () => createLazyComponent(() => import('@/pages/AdminLogistics')),
  AdminEvents: () => createLazyComponent(() => import('@/pages/AdminEvents')),
  GenerateOGImage: () => createLazyComponent(() => import('@/pages/GenerateOGImage')),
};

// Ленивое создание компонентов только когда они нужны
const getComponent = (name: string): ComponentType<any> => {
  if (criticalComponents[name as keyof typeof criticalComponents]) {
    return criticalComponents[name as keyof typeof criticalComponents]();
  }
  if (mainComponents[name as keyof typeof mainComponents]) {
    return mainComponents[name as keyof typeof mainComponents]();
  }
  if (sellerComponents[name as keyof typeof sellerComponents]) {
    return sellerComponents[name as keyof typeof sellerComponents]();
  }
  if (buyerComponents[name as keyof typeof buyerComponents]) {
    return buyerComponents[name as keyof typeof buyerComponents]();
  }
  if (storeComponents[name as keyof typeof storeComponents]) {
    return storeComponents[name as keyof typeof storeComponents]();
  }
  if (adminComponents[name as keyof typeof adminComponents]) {
    return adminComponents[name as keyof typeof adminComponents]();
  }
  
  // Fallback
  return criticalComponents.NotFound();
};

// Конфигурация маршрутов без предварительного создания компонентов
export const routes = [
  // Критические маршруты
  {
    path: "/",
    element: React.createElement(getComponent('Index')),
  },
  {
    path: "/login",
    element: React.createElement(getComponent('Login')),
  },
  {
    path: "/register",
    element: React.createElement(getComponent('Register')),
  },
  {
    path: "/catalog",
    element: React.createElement(getComponent('Catalog')),
  },
  
  // Основные маршруты
  {
    path: "/about",
    element: React.createElement(getComponent('About')),
  },
  {
    path: "/contact",
    element: React.createElement(getComponent('Contact')),
  },
  {
    path: "/product/:id",
    element: React.createElement(getComponent('ProductDetail')),
  },
  {
    path: "/forgot-password",
    element: React.createElement(getComponent('ForgotPassword')),
  },
  {
    path: "/reset-password",
    element: React.createElement(getComponent('ResetPassword')),
  },
  {
    path: "/verify-email",
    element: React.createElement(getComponent('VerifyEmail')),
  },
  
  // Защищенные маршруты
  {
    path: "/profile",
    element: React.createElement(getComponent('Profile')),
    protected: true,
  },
  
  // Продавцы
  {
    path: "/seller/register",
    element: React.createElement(getComponent('SellerRegister')),
  },
  {
    path: "/seller/dashboard",
    element: React.createElement(getComponent('SellerDashboard')),
    protected: true,
  },
  {
    path: "/seller/listings",
    element: React.createElement(getComponent('SellerListings')),
    protected: true,
  },
  {
    path: "/seller/add-product",
    element: React.createElement(getComponent('SellerAddProduct')),
    protected: true,
  },
  {
    path: "/seller/create-order",
    element: React.createElement(getComponent('SellerCreateOrder')),
    protected: true,
  },
  {
    path: "/seller/orders",
    element: React.createElement(getComponent('SellerOrders')),
    protected: true,
  },
  {
    path: "/seller/orders/:id",
    element: React.createElement(getComponent('SellerOrderDetails')),
    protected: true,
  },
  {
    path: "/seller/sell-product/:id",
    element: React.createElement(getComponent('SellerSellProduct')),
    protected: true,
  },
  {
    path: "/seller/profile",
    element: React.createElement(getComponent('SellerProfile')),
    protected: true,
  },
  {
    path: "/seller/:id",
    element: React.createElement(getComponent('PublicSellerProfile')),
  },
  
  // Покупатели
  {
    path: "/buyer/create-order",
    element: React.createElement(getComponent('BuyerCreateOrder')),
    protected: true,
  },
  {
    path: "/buyer/orders",
    element: React.createElement(getComponent('BuyerOrders')),
    protected: true,
  },
  {
    path: "/buyer/guide",
    element: React.createElement(getComponent('BuyerGuide')),
  },
  
  // Магазины
  {
    path: "/stores",
    element: React.createElement(getComponent('Stores')),
  },
  {
    path: "/store/:id",
    element: React.createElement(getComponent('StoreDetail')),
  },
  {
    path: "/create-store",
    element: React.createElement(getComponent('CreateStore')),
    protected: true,
  },
  
  // Заявки
  {
    path: "/requests",
    element: React.createElement(getComponent('Requests')),
  },
  {
    path: "/create-request",
    element: React.createElement(getComponent('CreateRequest')),
    protected: true,
  },
  {
    path: "/request/:id",
    element: React.createElement(getComponent('RequestDetail')),
  },
  
  // Заказы
  {
    path: "/orders",
    element: React.createElement(getComponent('OrdersRedirect')),
    protected: true,
  },
  {
    path: "/order/:id",
    element: React.createElement(getComponent('OrderDetails')),
  },
  
  // Админ маршруты (загружаются только для админов)
  {
    path: "/admin",
    element: React.createElement(getComponent('AdminDashboard')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/dashboard",
    element: React.createElement(getComponent('AdminDashboard')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/users",
    element: React.createElement(getComponent('AdminUsers')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/products",
    element: React.createElement(getComponent('AdminProducts')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/add-product",
    element: React.createElement(getComponent('AdminAddProduct')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders",
    element: React.createElement(getComponent('AdminOrders')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders/:id",
    element: React.createElement(getComponent('AdminOrderDetails')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/free-order",
    element: React.createElement(getComponent('AdminFreeOrder')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order-from-product",
    element: React.createElement(getComponent('AdminCreateOrderFromProduct')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order/:productId",
    element: React.createElement(getComponent('AdminCreateOrderFromProduct')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/stores",
    element: React.createElement(getComponent('AdminStores')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/car-catalog",
    element: React.createElement(getComponent('AdminCarCatalog')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/logistics",
    element: React.createElement(getComponent('AdminLogistics')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/events",
    element: React.createElement(getComponent('AdminEvents')),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/generate-og-image",
    element: React.createElement(getComponent('GenerateOGImage')),
    protected: true,
    adminOnly: true,
  },
  
  // 404
  {
    path: "*",
    element: React.createElement(getComponent('NotFound')),
  },
];

// Предзагрузка критических маршрутов после инициализации
export const preloadCriticalRoutes = () => {
  // Предзагружаем самые важные компоненты через небольшое время
  setTimeout(() => {
    import('@/pages/Index');
    import('@/pages/Login');
    import('@/pages/Register');
    import('@/pages/Catalog');
  }, 2000);
  
  // Предзагружаем основные компоненты через больше времени
  setTimeout(() => {
    import('@/pages/About');
    import('@/pages/Contact');
    import('@/pages/ProductDetail');
  }, 5000);
};
