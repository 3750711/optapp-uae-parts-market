
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Lazy loaded админские страницы
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminAddProduct = lazy(() => import('@/pages/AdminAddProduct'));
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
const AdminProductModeration = lazy(() => import('@/pages/AdminProductModeration'));
const AdminTelegramMonitoring = lazy(() => import('@/pages/AdminTelegramMonitoring'));
const AdminHelpEditor = lazy(() => import('@/pages/AdminHelpEditor'));
const AdminSynonyms = lazy(() => import('@/pages/AdminSynonyms'));
const AdminSellerStatistics = lazy(() => import('@/pages/admin/AdminSellerStatistics'));
const AdminSettings = lazy(() => import('@/pages/AdminSettings'));

export const AdminRoutes = () => (
  <>
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
    <Route path="/admin/product-moderation" element={
      <AdminRoute>
        <AdminProductModeration />
      </AdminRoute>
    } />
    <Route path="/admin/telegram-monitoring" element={
      <AdminRoute>
        <AdminTelegramMonitoring />
      </AdminRoute>
    } />
    <Route path="/admin/help-editor" element={
      <AdminRoute>
        <AdminHelpEditor />
      </AdminRoute>
    } />
    <Route path="/admin/synonyms" element={
      <AdminRoute>
        <AdminSynonyms />
      </AdminRoute>
    } />
    <Route path="/admin/seller-statistics" element={
      <AdminRoute>
        <AdminSellerStatistics />
      </AdminRoute>
    } />
    <Route path="/admin/settings" element={
      <AdminRoute>
        <AdminSettings />
      </AdminRoute>
    } />
  </>
);
