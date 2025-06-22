
import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Критически важные админские страницы - загружаются без lazy loading
import AdminDashboard from '@/pages/AdminDashboard';
import AdminAddProduct from '@/pages/AdminAddProduct';

// Специальные компоненты для редиректов
import OrdersRedirect from '@/pages/OrdersRedirect';

// Lazy loaded страницы
const Index = lazy(() => import('@/pages/Index'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));

// Аутентификация
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const SellerRegister = lazy(() => import('@/pages/SellerRegister'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));

// Магазины и запросы
const Stores = lazy(() => import('@/pages/Stores'));
const StoreDetail = lazy(() => import('@/pages/StoreDetail'));
const CreateStore = lazy(() => import('@/pages/CreateStore'));
const Requests = lazy(() => import('@/pages/Requests'));
const RequestDetail = lazy(() => import('@/pages/RequestDetail'));
const CreateRequest = lazy(() => import('@/pages/CreateRequest'));

// Админские страницы
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

// Пользовательские страницы
const Profile = lazy(() => import('@/pages/Profile'));
const BuyerOrders = lazy(() => import('@/pages/BuyerOrders'));
const BuyerCreateOrder = lazy(() => import('@/pages/BuyerCreateOrder'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));
const BuyerGuide = lazy(() => import('@/pages/BuyerGuide'));

// Продавецкие страницы
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const SellerListings = lazy(() => import('@/pages/SellerListings'));
const SellerAddProduct = lazy(() => import('@/pages/SellerAddProduct'));
const SellerOrders = lazy(() => import('@/pages/SellerOrders'));
const SellerOrderDetails = lazy(() => import('@/pages/SellerOrderDetails'));
const SellerCreateOrder = lazy(() => import('@/pages/SellerCreateOrder'));
const SellerSellProduct = lazy(() => import('@/pages/SellerSellProduct'));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const PublicSellerProfile = lazy(() => import('@/pages/PublicSellerProfile'));

// Дополнительные страницы
const GenerateOGImage = lazy(() => import('@/pages/GenerateOGImage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/store/:id" element={<StoreDetail />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/request/:id" element={<RequestDetail />} />
      <Route path="/buyer-guide" element={<BuyerGuide />} />
      <Route path="/public-seller-profile/:id" element={<PublicSellerProfile />} />
      <Route path="/generate-og-image" element={<GenerateOGImage />} />

      {/* Аутентификация */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/seller-register" element={<SellerRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Защищенные пользовательские маршруты */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
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

      {/* Специальные редиректы */}
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersRedirect />
        </ProtectedRoute>
      } />

      {/* Обработка ошибок */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
