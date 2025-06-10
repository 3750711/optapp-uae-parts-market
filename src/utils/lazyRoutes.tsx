import { lazy } from 'react';

const Index = lazy(() => import('@/pages/Index'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const SellerRegister = lazy(() => import('@/pages/SellerRegister'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Profile = lazy(() => import('@/pages/Profile'));
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
const NotFound = lazy(() => import('@/pages/NotFound'));
const OrdersRedirect = lazy(() => import('@/pages/OrdersRedirect'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));

// Admin pages - исправляем импорты с более надежной обработкой ошибок
const AdminDashboard = lazy(() => 
  import('@/pages/AdminDashboard').catch(() => 
    import('@/pages/AdminDashboard').then(module => ({ default: module.default }))
  )
);
const AdminUsers = lazy(() => 
  import('@/pages/AdminUsers').catch(() => 
    import('@/pages/AdminUsers').then(module => ({ default: module.default }))
  )
);
const AdminProducts = lazy(() => 
  import('@/pages/AdminProducts').catch(() => 
    import('@/pages/AdminProducts').then(module => ({ default: module.default }))
  )
);
const AdminAddProduct = lazy(() => 
  import('@/pages/AdminAddProduct').catch(() => 
    import('@/pages/AdminAddProduct').then(module => ({ default: module.default }))
  )
);
const AdminOrders = lazy(() => 
  import('@/pages/AdminOrders').catch(() => 
    import('@/pages/AdminOrders').then(module => ({ default: module.default }))
  )
);
const AdminOrderDetails = lazy(() => 
  import('@/pages/AdminOrderDetails').catch(() => 
    import('@/pages/AdminOrderDetails').then(module => ({ default: module.default }))
  )
);
const AdminFreeOrder = lazy(() => 
  import('@/pages/AdminFreeOrder').catch(() => 
    import('@/pages/AdminFreeOrder').then(module => ({ default: module.default }))
  )
);
const AdminCreateOrderFromProduct = lazy(() => 
  import('@/pages/AdminCreateOrderFromProduct').catch(() => 
    import('@/pages/AdminCreateOrderFromProduct').then(module => ({ default: module.default }))
  )
);
const AdminStores = lazy(() => 
  import('@/pages/AdminStores').catch(() => 
    import('@/pages/AdminStores').then(module => ({ default: module.default }))
  )
);
const AdminCarCatalog = lazy(() => 
  import('@/pages/AdminCarCatalog').catch(() => 
    import('@/pages/AdminCarCatalog').then(module => ({ default: module.default }))
  )
);
const AdminLogistics = lazy(() => 
  import('@/pages/AdminLogistics').catch(() => 
    import('@/pages/AdminLogistics').then(module => ({ default: module.default }))
  )
);
const AdminEvents = lazy(() => 
  import('@/pages/AdminEvents').catch(() => 
    import('@/pages/AdminEvents').then(module => ({ default: module.default }))
  )
);
const GenerateOGImage = lazy(() => 
  import('@/pages/GenerateOGImage').catch(() => 
    import('@/pages/GenerateOGImage').then(module => ({ default: module.default }))
  )
);

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
  // Admin routes - исправленные маршруты
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
