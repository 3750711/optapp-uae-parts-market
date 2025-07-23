import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteSEO from '@/components/routing/RouteSEO';
import { RouteErrorBoundary } from '@/components/routing/RouteErrorBoundary';
import { RouteSuspenseFallback } from '@/components/routing/RouteSuspenseFallback';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import CatalogErrorBoundary from '@/components/catalog/CatalogErrorBoundary';

// Lazy loaded публичные страницы
const Index = lazy(() => import('@/pages/Index'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Stores = lazy(() => import('@/pages/Stores'));
const StoreDetail = lazy(() => import('@/pages/StoreDetail'));
const Requests = lazy(() => import('@/pages/Requests'));
const RequestDetail = lazy(() => import('@/pages/RequestDetail'));
const BuyerGuide = lazy(() => import('@/pages/BuyerGuide'));
const PublicSellerProfile = lazy(() => import('@/pages/PublicSellerProfile'));
const GenerateOGImage = lazy(() => import('@/pages/GenerateOGImage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Lazy loaded страницы аутентификации
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const SellerRegister = lazy(() => import('@/pages/SellerRegister'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

// Lazy loaded защищенные страницы
const Profile = lazy(() => import('@/pages/Profile'));
const CreateStore = lazy(() => import('@/pages/CreateStore'));
const CreateRequest = lazy(() => import('@/pages/CreateRequest'));
const BuyerOrders = lazy(() => import('@/pages/BuyerOrders'));
const BuyerCreateOrder = lazy(() => import('@/pages/BuyerCreateOrder'));
const BuyerPriceOffers = lazy(() => import('@/pages/BuyerPriceOffers'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const OrdersRedirect = lazy(() => import('@/pages/OrdersRedirect'));
const OrderDetailsRedirect = lazy(() => import('@/components/routing/OrderDetailsRedirect').then(module => ({ default: module.default })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const Favorites = lazy(() => import('@/pages/Favorites'));

// Lazy loaded продавецкие страницы
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const SellerListings = lazy(() => import('@/pages/SellerListings'));
const SellerAddProduct = lazy(() => import('@/pages/SellerAddProduct'));
const SellerOrders = lazy(() => import('@/pages/SellerOrders'));
const SellerOrderDetails = lazy(() => import('@/pages/SellerOrderDetails'));
const SellerCreateOrder = lazy(() => import('@/pages/SellerCreateOrder'));
const SellerSellProduct = lazy(() => import('@/pages/SellerSellProduct'));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const SellerPriceOffers = lazy(() => import('@/pages/SellerPriceOffers'));

// Критически важные админские страницы - загружаются без lazy loading
import AdminDashboard from '@/pages/AdminDashboard';
import AdminAddProduct from '@/pages/AdminAddProduct';

// Lazy loaded админские страницы
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminProducts = lazy(() => import('@/pages/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminOrderDetails = lazy(() => import('@/pages/AdminOrderDetails'));
const AdminFreeOrder = lazy(() => import('@/pages/AdminFreeOrder'));
const AdminCreateOrderFromProduct = lazy(() => import('@/pages/AdminCreateOrderFromProduct'));
const AdminSellProduct = lazy(() => import('@/pages/AdminSellProduct'));
const AdminStores = lazy(() => import('@/pages/AdminStores'));
const OptimizedAdminStores = lazy(() => import('@/pages/OptimizedAdminStores'));
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const AdminLogistics = lazy(() => import('@/pages/AdminLogistics'));
const AdminCarCatalog = lazy(() => import('@/pages/AdminCarCatalog'));
const AdminMessages = lazy(() => import('@/pages/AdminMessages'));
const AdminPriceOffers = lazy(() => import('@/pages/admin/AdminPriceOffers'));

// Mobile specific pages
const MobileProfileMenu = lazy(() => import('@/pages/MobileProfileMenu'));

const AppRoutes: React.FC = () => {
  return (
    <>
      <RouteSEO />
      <RouteErrorBoundary>
        <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/catalog" element={
              <CatalogErrorBoundary>
                <Catalog />
              </CatalogErrorBoundary>
            } />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/store/:id" element={<StoreDetail />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/request/:id" element={<RequestDetail />} />
            <Route path="/buyer-guide" element={<BuyerGuide />} />
            <Route path="/seller/:id" element={<PublicSellerProfile />} />
            <Route path="/public-seller-profile/:id" element={<PublicSellerProfile />} />
            <Route path="/generate-og-image" element={<GenerateOGImage />} />
            <Route path="/404" element={<NotFound />} />

            {/* Маршруты аутентификации */}
            <Route path="/login" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <Register />
              </Suspense>
            } />
            <Route path="/seller-register" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <SellerRegister />
              </Suspense>
            } />
            <Route path="/forgot-password" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <ForgotPassword />
              </Suspense>
            } />
            <Route path="/reset-password" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <ResetPassword />
              </Suspense>
            } />
            <Route path="/verify-email" element={
              <Suspense fallback={<RouteSuspenseFallback />}>
                <VerifyEmail />
              </Suspense>
            } />

            {/* Защищенные маршруты */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile-menu" element={
              <ProtectedRoute>
                <MobileProfileMenu />
              </ProtectedRoute>
            } />
            <Route path="/create-store" element={
              <ProtectedRoute>
                <CreateStore />
              </ProtectedRoute>
            } />
            <Route path="/create-request" element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            } />
            <Route path="/buyer-orders" element={
              <ProtectedRoute>
                <BuyerOrders />
              </ProtectedRoute>
            } />
            <Route path="/buyer-create-order" element={
              <ProtectedRoute>
                <BuyerCreateOrder />
              </ProtectedRoute>
            } />
            <Route path="/order-details/:id" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetailsRedirect />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersRedirect />
              </ProtectedRoute>
            } />
            <Route path="/buyer-price-offers" element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerPriceOffers />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } />

            {/* Продавецкие маршруты */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/seller/dashboard" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/seller/listings" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerListings />
              </ProtectedRoute>
            } />
            <Route path="/seller/add-product" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerAddProduct />
              </ProtectedRoute>
            } />
            <Route path="/seller/orders" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerOrders />
              </ProtectedRoute>
            } />
            <Route path="/seller/orders/:id" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerOrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/seller/order-details/:id" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerOrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/seller/create-order" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerCreateOrder />
              </ProtectedRoute>
            } />
            <Route path="/seller/sell-product" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerSellProduct />
              </ProtectedRoute>
            } />
            <Route path="/seller/profile" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerProfile />
              </ProtectedRoute>
            } />
            <Route path="/seller/price-offers" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerPriceOffers />
              </ProtectedRoute>
            } />

            {/* Админские маршруты */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/add-product" element={
              <AdminRoute>
                <AdminAddProduct />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <AdminRoute>
                <AdminOrderDetails />
              </AdminRoute>
            } />
            <Route path="/admin/free-order" element={
              <AdminRoute>
                <AdminFreeOrder />
              </AdminRoute>
            } />
            <Route path="/admin/create-order-from-product" element={
              <AdminRoute>
                <AdminCreateOrderFromProduct />
              </AdminRoute>
            } />
            <Route path="/admin/create-order-from-product/:id" element={
              <AdminRoute>
                <AdminCreateOrderFromProduct />
              </AdminRoute>
            } />
            <Route path="/admin/sell-product" element={
              <AdminRoute>
                <AdminSellProduct />
              </AdminRoute>
            } />
            <Route path="/admin/stores" element={
              <AdminRoute>
                <AdminStores />
              </AdminRoute>
            } />
            <Route path="/admin/optimized-stores" element={
              <AdminRoute>
                <OptimizedAdminStores />
              </AdminRoute>
            } />
            <Route path="/admin/events" element={
              <AdminRoute>
                <AdminEvents />
              </AdminRoute>
            } />
            <Route path="/admin/logistics" element={
              <AdminRoute>
                <AdminLogistics />
              </AdminRoute>
            } />
            <Route path="/admin/car-catalog" element={
              <AdminRoute>
                <AdminCarCatalog />
              </AdminRoute>
            } />
            <Route path="/admin/messages" element={
              <AdminRoute>
                <AdminMessages />
              </AdminRoute>
            } />
            <Route path="/admin/price-offers" element={
              <AdminRoute>
                <AdminPriceOffers />
              </AdminRoute>
            } />

            {/* Catch-all маршрут */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </>
  );
};

export default AppRoutes;
