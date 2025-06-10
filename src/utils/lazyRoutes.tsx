import { lazy, ReactElement } from 'react';
import { devError, devLog } from '@/utils/performanceUtils';

// Улучшенная функция lazy loading с обработкой ошибок
const createLazyComponent = (importFunc: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    try {
      const module = await importFunc();
      // Проверяем что модуль имеет default export
      if (!module || !module.default) {
        throw new Error(`Component ${componentName} has no default export`);
      }
      return module;
    } catch (error: any) {
      devError(`Failed to load component ${componentName}:`, error);
      
      const isChunkError = error.message?.includes('loading dynamically imported module') ||
                          error.message?.includes('Failed to fetch dynamically imported module') ||
                          error.message?.includes('Loading chunk') ||
                          error.name === 'ChunkLoadError';
      
      if (isChunkError) {
        devLog(`Chunk load error for ${componentName}, attempting retry...`);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryModule = await importFunc();
          if (!retryModule || !retryModule.default) {
            throw new Error(`Component ${componentName} has no default export after retry`);
          }
          return retryModule;
        } catch (retryError) {
          devError(`Retry failed for ${componentName}:`, retryError);
        }
      }
      
      // Возвращаем fallback компонент вместо выброса ошибки
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-gray-800 mb-2">Ошибка загрузки компонента {componentName}</p>
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
  });
};

// Функция для безопасного создания элемента маршрута
const createRouteElement = (LazyComponent: React.LazyExoticComponent<any>): ReactElement => {
  try {
    return <LazyComponent />;
  } catch (error) {
    devError('Failed to create route element:', error);
    // Возвращаем fallback элемент
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-2">Ошибка создания маршрута</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }
};

// Создаем все lazy компоненты сразу
const Index = createLazyComponent(() => import('@/pages/Index'), 'Index');
const Login = createLazyComponent(() => import('@/pages/Login'), 'Login');
const Register = createLazyComponent(() => import('@/pages/Register'), 'Register');
const Catalog = createLazyComponent(() => import('@/pages/Catalog'), 'Catalog');
const About = createLazyComponent(() => import('@/pages/About'), 'About');
const Contact = createLazyComponent(() => import('@/pages/Contact'), 'Contact');
const ProductDetail = createLazyComponent(() => import('@/pages/ProductDetail'), 'ProductDetail');
const ForgotPassword = createLazyComponent(() => import('@/pages/ForgotPassword'), 'ForgotPassword');
const ResetPassword = createLazyComponent(() => import('@/pages/ResetPassword'), 'ResetPassword');
const VerifyEmail = createLazyComponent(() => import('@/pages/VerifyEmail'), 'VerifyEmail');
const Profile = createLazyComponent(() => import('@/pages/Profile'), 'Profile');
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
const BuyerCreateOrder = createLazyComponent(() => import('@/pages/BuyerCreateOrder'), 'BuyerCreateOrder');
const BuyerOrders = createLazyComponent(() => import('@/pages/BuyerOrders'), 'BuyerOrders');
const BuyerGuide = createLazyComponent(() => import('@/pages/BuyerGuide'), 'BuyerGuide');
const Stores = createLazyComponent(() => import('@/pages/Stores'), 'Stores');
const StoreDetail = createLazyComponent(() => import('@/pages/StoreDetail'), 'StoreDetail');
const CreateStore = createLazyComponent(() => import('@/pages/CreateStore'), 'CreateStore');
const Requests = createLazyComponent(() => import('@/pages/Requests'), 'Requests');
const CreateRequest = createLazyComponent(() => import('@/pages/CreateRequest'), 'CreateRequest');
const RequestDetail = createLazyComponent(() => import('@/pages/RequestDetail'), 'RequestDetail');
const OrdersRedirect = createLazyComponent(() => import('@/pages/OrdersRedirect'), 'OrdersRedirect');
const OrderDetails = createLazyComponent(() => import('@/pages/OrderDetails'), 'OrderDetails');
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
const NotFound = createLazyComponent(() => import('@/pages/NotFound'), 'NotFound');

// Интерфейс для маршрута
interface RouteConfig {
  path: string;
  element: ReactElement;
  protected?: boolean;
  adminOnly?: boolean;
}

// Конфигурация маршрутов с безопасным созданием элементов
export const routes: RouteConfig[] = [
  // Критические маршруты
  {
    path: "/",
    element: createRouteElement(Index),
  },
  {
    path: "/login", 
    element: createRouteElement(Login),
  },
  {
    path: "/register",
    element: createRouteElement(Register),
  },
  {
    path: "/catalog",
    element: createRouteElement(Catalog),
  },
  
  // Основные маршруты
  {
    path: "/about",
    element: createRouteElement(About),
  },
  {
    path: "/contact",
    element: createRouteElement(Contact),
  },
  {
    path: "/product/:id",
    element: createRouteElement(ProductDetail),
  },
  {
    path: "/forgot-password",
    element: createRouteElement(ForgotPassword),
  },
  {
    path: "/reset-password",
    element: createRouteElement(ResetPassword),
  },
  {
    path: "/verify-email",
    element: createRouteElement(VerifyEmail),
  },
  {
    path: "/profile",
    element: createRouteElement(Profile),
    protected: true,
  },
  
  // Продавцы
  {
    path: "/seller/register",
    element: createRouteElement(SellerRegister),
  },
  {
    path: "/seller/dashboard",
    element: createRouteElement(SellerDashboard),
    protected: true,
  },
  {
    path: "/seller/listings",
    element: createRouteElement(SellerListings),
    protected: true,
  },
  {
    path: "/seller/add-product",
    element: createRouteElement(SellerAddProduct),
    protected: true,
  },
  {
    path: "/seller/create-order",
    element: createRouteElement(SellerCreateOrder),
    protected: true,
  },
  {
    path: "/seller/orders",
    element: createRouteElement(SellerOrders),
    protected: true,
  },
  {
    path: "/seller/orders/:id",
    element: createRouteElement(SellerOrderDetails),
    protected: true,
  },
  {
    path: "/seller/sell-product/:id",
    element: createRouteElement(SellerSellProduct),
    protected: true,
  },
  {
    path: "/seller/profile",
    element: createRouteElement(SellerProfile),
    protected: true,
  },
  {
    path: "/seller/:id",
    element: createRouteElement(PublicSellerProfile),
  },
  
  // Покупатели
  {
    path: "/buyer/create-order",
    element: createRouteElement(BuyerCreateOrder),
    protected: true,
  },
  {
    path: "/buyer/orders",
    element: createRouteElement(BuyerOrders),
    protected: true,
  },
  {
    path: "/buyer/guide",
    element: createRouteElement(BuyerGuide),
  },
  
  // Магазины
  {
    path: "/stores",
    element: createRouteElement(Stores),
  },
  {
    path: "/store/:id",
    element: createRouteElement(StoreDetail),
  },
  {
    path: "/create-store",
    element: createRouteElement(CreateStore),
    protected: true,
  },
  
  // Заявки
  {
    path: "/requests",
    element: createRouteElement(Requests),
  },
  {
    path: "/create-request",
    element: createRouteElement(CreateRequest),
    protected: true,
  },
  {
    path: "/request/:id",
    element: createRouteElement(RequestDetail),
  },
  
  // Заказы
  {
    path: "/orders",
    element: createRouteElement(OrdersRedirect),
    protected: true,
  },
  {
    path: "/order/:id",
    element: createRouteElement(OrderDetails),
  },
  
  // Админ маршруты
  {
    path: "/admin",
    element: createRouteElement(AdminDashboard),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/dashboard",
    element: createRouteElement(AdminDashboard),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/users",
    element: createRouteElement(AdminUsers),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/products",
    element: createRouteElement(AdminProducts),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/add-product",
    element: createRouteElement(AdminAddProduct),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders",
    element: createRouteElement(AdminOrders),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/orders/:id",
    element: createRouteElement(AdminOrderDetails),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/free-order",
    element: createRouteElement(AdminFreeOrder),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order-from-product",
    element: createRouteElement(AdminCreateOrderFromProduct),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/create-order/:productId",
    element: createRouteElement(AdminCreateOrderFromProduct),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/stores",
    element: createRouteElement(AdminStores),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/car-catalog",
    element: createRouteElement(AdminCarCatalog),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/logistics",
    element: createRouteElement(AdminLogistics),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/admin/events",
    element: createRouteElement(AdminEvents),
    protected: true,
    adminOnly: true,
  },
  {
    path: "/generate-og-image",
    element: createRouteElement(GenerateOGImage),
    protected: true,
    adminOnly: true,
  },
  
  // 404
  {
    path: "*",
    element: createRouteElement(NotFound),
  },
].filter(route => route.element !== null); // Фильтруем null элементы

// Функция предзагрузки критических компонентов
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

// Очистка кэша для разработки
if (process.env.NODE_ENV === 'development') {
  (window as any).__clearComponentCache = () => {
    console.log('Component cache operations removed - using direct React elements now');
  };
}
