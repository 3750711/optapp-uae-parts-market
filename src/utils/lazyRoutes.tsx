import { lazy, ReactElement } from 'react';
import { devError, devLog } from '@/utils/performanceUtils';

// Улучшенная функция lazy loading без агрессивной перезагрузки
const createLazyComponent = (importFunc: () => Promise<any>) => {
  return lazy(async () => {
    try {
      return await importFunc();
    } catch (error: any) {
      devError('Failed to load module:', error);
      
      const isChunkError = error.message?.includes('loading dynamically imported module') ||
                          error.message?.includes('Failed to fetch dynamically imported module') ||
                          error.message?.includes('Loading chunk') ||
                          error.name === 'ChunkLoadError';
      
      if (isChunkError) {
        devLog('Chunk load error, attempting retry...');
        
        // Одна попытка retry с задержкой
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await importFunc();
        } catch (retryError) {
          devError('Retry failed:', retryError);
          
          // Возвращаем компонент с кнопкой обновления вместо автоматической перезагрузки
          return {
            default: () => (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-gray-800 mb-2">Ошибка загрузки компонента</p>
                    <p className="text-gray-600 text-sm mb-4">Возможно, доступна новая версия приложения</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Обновить страницу
                  </button>
                </div>
              </div>
            )
          };
        }
      }
      
      throw error;
    }
  });
};

// Кэш для lazy компонентов - создаем только при необходимости
const componentCache = new Map<string, ReturnType<typeof createLazyComponent>>();

// Функция для получения компонента из кэша или создания нового
const getLazyComponent = (name: string, importFunc: () => Promise<any>) => {
  if (!componentCache.has(name)) {
    componentCache.set(name, createLazyComponent(importFunc));
  }
  return componentCache.get(name)!;
};

// Критические компоненты - создаем сразу
const Index = createLazyComponent(() => import('@/pages/Index'));
const Login = createLazyComponent(() => import('@/pages/Login'));
const Register = createLazyComponent(() => import('@/pages/Register'));
const Catalog = createLazyComponent(() => import('@/pages/Catalog'));
const NotFound = createLazyComponent(() => import('@/pages/NotFound'));

// Конфигурация маршрутов с ленивым созданием компонентов
export const routes = [
  // Критические маршруты (создаются сразу)
  {
    path: "/",
    element: <Index />,
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
    path: "/catalog",
    element: <Catalog />,
  },
  
  // Основные маршруты (создаются по требованию)
  {
    path: "/about",
    get element(): ReactElement {
      const About = getLazyComponent('About', () => import('@/pages/About'));
      return <About />;
    },
  },
  {
    path: "/contact",
    get element(): ReactElement {
      const Contact = getLazyComponent('Contact', () => import('@/pages/Contact'));
      return <Contact />;
    },
  },
  {
    path: "/product/:id",
    get element(): ReactElement {
      const ProductDetail = getLazyComponent('ProductDetail', () => import('@/pages/ProductDetail'));
      return <ProductDetail />;
    },
  },
  {
    path: "/forgot-password",
    get element(): ReactElement {
      const ForgotPassword = getLazyComponent('ForgotPassword', () => import('@/pages/ForgotPassword'));
      return <ForgotPassword />;
    },
  },
  {
    path: "/reset-password",
    get element(): ReactElement {
      const ResetPassword = getLazyComponent('ResetPassword', () => import('@/pages/ResetPassword'));
      return <ResetPassword />;
    },
  },
  {
    path: "/verify-email",
    get element(): ReactElement {
      const VerifyEmail = getLazyComponent('VerifyEmail', () => import('@/pages/VerifyEmail'));
      return <VerifyEmail />;
    },
  },
  {
    path: "/profile",
    get element(): ReactElement {
      const Profile = getLazyComponent('Profile', () => import('@/pages/Profile'));
      return <Profile />;
    },
    protected: true,
  },
  
  // Продавцы (создаются только при переходе)
  {
    path: "/seller/register",
    get element(): ReactElement {
      const SellerRegister = getLazyComponent('SellerRegister', () => import('@/pages/SellerRegister'));
      return <SellerRegister />;
    },
  },
  {
    path: "/seller/dashboard",
    get element(): ReactElement {
      const SellerDashboard = getLazyComponent('SellerDashboard', () => import('@/pages/SellerDashboard'));
      return <SellerDashboard />;
    },
    protected: true,
  },
  {
    path: "/seller/listings",
    get element(): ReactElement {
      const SellerListings = getLazyComponent('SellerListings', () => import('@/pages/SellerListings'));
      return <SellerListings />;
    },
    protected: true,
  },
  {
    path: "/seller/add-product",
    get element(): ReactElement {
      const SellerAddProduct = getLazyComponent('SellerAddProduct', () => import('@/pages/SellerAddProduct'));
      return <SellerAddProduct />;
    },
    protected: true,
  },
  {
    path: "/seller/create-order",
    get element(): ReactElement {
      const SellerCreateOrder = getLazyComponent('SellerCreateOrder', () => import('@/pages/SellerCreateOrder'));
      return <SellerCreateOrder />;
    },
    protected: true,
  },
  {
    path: "/seller/orders",
    get element(): ReactElement {
      const SellerOrders = getLazyComponent('SellerOrders', () => import('@/pages/SellerOrders'));
      return <SellerOrders />;
    },
    protected: true,
  },
  {
    path: "/seller/orders/:id",
    get element(): ReactElement {
      const SellerOrderDetails = getLazyComponent('SellerOrderDetails', () => import('@/pages/SellerOrderDetails'));
      return <SellerOrderDetails />;
    },
    protected: true,
  },
  {
    path: "/seller/sell-product/:id",
    get element(): ReactElement {
      const SellerSellProduct = getLazyComponent('SellerSellProduct', () => import('@/pages/SellerSellProduct'));
      return <SellerSellProduct />;
    },
    protected: true,
  },
  {
    path: "/seller/profile",
    get element(): ReactElement {
      const SellerProfile = getLazyComponent('SellerProfile', () => import('@/pages/SellerProfile'));
      return <SellerProfile />;
    },
    protected: true,
  },
  {
    path: "/seller/:id",
    get element(): ReactElement {
      const PublicSellerProfile = getLazyComponent('PublicSellerProfile', () => import('@/pages/PublicSellerProfile'));
      return <PublicSellerProfile />;
    },
  },
  
  // Покупатели
  {
    path: "/buyer/create-order",
    get element(): ReactElement {
      const BuyerCreateOrder = getLazyComponent('BuyerCreateOrder', () => import('@/pages/BuyerCreateOrder'));
      return <BuyerCreateOrder />;
    },
    protected: true,
  },
  {
    path: "/buyer/orders",
    get element(): ReactElement {
      const BuyerOrders = getLazyComponent('BuyerOrders', () => import('@/pages/BuyerOrders'));
      return <BuyerOrders />;
    },
    protected: true,
  },
  {
    path: "/buyer/guide",
    get element(): ReactElement {
      const BuyerGuide = getLazyComponent('BuyerGuide', () => import('@/pages/BuyerGuide'));
      return <BuyerGuide />;
    },
  },
  
  // Магазины
  {
    path: "/stores",
    get element(): ReactElement {
      const Stores = getLazyComponent('Stores', () => import('@/pages/Stores'));
      return <Stores />;
    },
  },
  {
    path: "/store/:id",
    get element(): ReactElement {
      const StoreDetail = getLazyComponent('StoreDetail', () => import('@/pages/StoreDetail'));
      return <StoreDetail />;
    },
  },
  {
    path: "/create-store",
    get element(): ReactElement {
      const CreateStore = getLazyComponent('CreateStore', () => import('@/pages/CreateStore'));
      return <CreateStore />;
    },
    protected: true,
  },
  
  // Заявки
  {
    path: "/requests",
    get element(): ReactElement {
      const Requests = getLazyComponent('Requests', () => import('@/pages/Requests'));
      return <Requests />;
    },
  },
  {
    path: "/create-request",
    get element(): ReactElement {
      const CreateRequest = getLazyComponent('CreateRequest', () => import('@/pages/CreateRequest'));
      return <CreateRequest />;
    },
    protected: true,
  },
  {
    path: "/request/:id",
    get element(): ReactElement {
      const RequestDetail = getLazyComponent('RequestDetail', () => import('@/pages/RequestDetail'));
      return <RequestDetail />;
    },
  },
  
  // Заказы
  {
    path: "/orders",
    get element(): ReactElement {
      const OrdersRedirect = getLazyComponent('OrdersRedirect', () => import('@/pages/OrdersRedirect'));
      return <OrdersRedirect />;
    },
    protected: true,
  },
  {
    path: "/order/:id",
    get element(): ReactElement {
      const OrderDetails = getLazyComponent('OrderDetails', () => import('@/pages/OrderDetails'));
      return <OrderDetails />;
    },
  },
  
  // Админ маршруты (создаются только для админов)
  {
    path: "/admin",
    get element(): ReactElement {
      const AdminDashboard = getLazyComponent('AdminDashboard', () => import('@/pages/AdminDashboard'));
      return <AdminDashboard />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/dashboard",
    get element(): ReactElement {
      const AdminDashboard = getLazyComponent('AdminDashboard', () => import('@/pages/AdminDashboard'));
      return <AdminDashboard />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/users",
    get element(): ReactElement {
      const AdminUsers = getLazyComponent('AdminUsers', () => import('@/pages/AdminUsers'));
      return <AdminUsers />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/products",
    get element(): ReactElement {
      const AdminProducts = getLazyComponent('AdminProducts', () => import('@/pages/AdminProducts'));
      return <AdminProducts />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/add-product",
    get element(): ReactElement {
      const AdminAddProduct = getLazyComponent('AdminAddProduct', () => import('@/pages/AdminAddProduct'));
      return <AdminAddProduct />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders",
    get element(): ReactElement {
      const AdminOrders = getLazyComponent('AdminOrders', () => import('@/pages/AdminOrders'));
      return <AdminOrders />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders/:id",
    get element(): ReactElement {
      const AdminOrderDetails = getLazyComponent('AdminOrderDetails', () => import('@/pages/AdminOrderDetails'));
      return <AdminOrderDetails />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/free-order",
    get element(): ReactElement {
      const AdminFreeOrder = getLazyComponent('AdminFreeOrder', () => import('@/pages/AdminFreeOrder'));
      return <AdminFreeOrder />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order-from-product",
    get element(): ReactElement {
      const AdminCreateOrderFromProduct = getLazyComponent('AdminCreateOrderFromProduct', () => import('@/pages/AdminCreateOrderFromProduct'));
      return <AdminCreateOrderFromProduct />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order/:productId",
    get element(): ReactElement {
      const AdminCreateOrderFromProduct = getLazyComponent('AdminCreateOrderFromProduct', () => import('@/pages/AdminCreateOrderFromProduct'));
      return <AdminCreateOrderFromProduct />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/stores",
    get element(): ReactElement {
      const AdminStores = getLazyComponent('AdminStores', () => import('@/pages/AdminStores'));
      return <AdminStores />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/car-catalog",
    get element(): ReactElement {
      const AdminCarCatalog = getLazyComponent('AdminCarCatalog', () => import('@/pages/AdminCarCatalog'));
      return <AdminCarCatalog />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/logistics",
    get element(): ReactElement {
      const AdminLogistics = getLazyComponent('AdminLogistics', () => import('@/pages/AdminLogistics'));
      return <AdminLogistics />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/events",
    get element(): ReactElement {
      const AdminEvents = getLazyComponent('AdminEvents', () => import('@/pages/AdminEvents'));
      return <AdminEvents />;
    },
    protected: true,
    adminOnly: true,
  },
  {
    path: "/generate-og-image",
    get element(): ReactElement {
      const GenerateOGImage = getLazyComponent('GenerateOGImage', () => import('@/pages/GenerateOGImage'));
      return <GenerateOGImage />;
    },
    protected: true,
    adminOnly: true,
  },
  
  // 404
  {
    path: "*",
    element: <NotFound />,
  },
];

// Функция предзагрузки критических компонентов
export const preloadCriticalRoutes = () => {
  // Предзагружаем самые важные компоненты через 2 секунды
  setTimeout(() => {
    import('@/pages/About');
    import('@/pages/Contact');
    import('@/pages/ProductDetail');
  }, 2000);
  
  // Предзагружаем дополнительные компоненты через 5 секунд
  setTimeout(() => {
    import('@/pages/Profile');
    import('@/pages/Stores');
  }, 5000);
};

// Очистка кэша для разработки
if (process.env.NODE_ENV === 'development') {
  (window as any).__clearComponentCache = () => {
    componentCache.clear();
    console.log('Component cache cleared');
  };
}
