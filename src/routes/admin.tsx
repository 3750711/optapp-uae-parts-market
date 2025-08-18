
import React, { lazy, Suspense } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Критически важные админские страницы - загружаются без lazy loading
import AdminDashboard from '@/pages/AdminDashboard';
import AdminAddProduct from '@/pages/AdminAddProduct';
import AdminFreeOrder from '@/pages/AdminFreeOrder';

// Lazy loaded админские страницы
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminProducts = lazy(() => import('@/pages/AdminProducts'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminOrderDetails = lazy(() => import('@/pages/AdminOrderDetails'));
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

export const getAdminRoutes = () => [
  {
    path: "/admin",
    element: <AdminRoute><AdminDashboard /></AdminRoute>
  },
  {
    path: "/admin/add-product", 
    element: <AdminRoute><AdminAddProduct /></AdminRoute>
  },
  {
    path: "/admin/users",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminUsers /></Suspense></AdminRoute>
  },
  {
    path: "/admin/products",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminProducts /></Suspense></AdminRoute>
  },
  {
    path: "/admin/orders",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminOrders /></Suspense></AdminRoute>
  },
  {
    path: "/admin/orders/:id",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminOrderDetails /></Suspense></AdminRoute>
  },
  {
    path: "/admin/free-order",
    element: <AdminRoute><AdminFreeOrder /></AdminRoute>
  },
  {
    path: "/admin/create-order-from-product",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminCreateOrderFromProduct /></Suspense></AdminRoute>
  },
  {
    path: "/admin/create-order-from-product/:id", 
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminCreateOrderFromProduct /></Suspense></AdminRoute>
  },
  {
    path: "/admin/sell-product",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminSellProduct /></Suspense></AdminRoute>
  },
  {
    path: "/admin/stores",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminStores /></Suspense></AdminRoute>
  },
  {
    path: "/admin/optimized-stores",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><OptimizedAdminStores /></Suspense></AdminRoute>
  },
  {
    path: "/admin/events",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminEvents /></Suspense></AdminRoute>
  },
  {
    path: "/admin/logistics",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminLogistics /></Suspense></AdminRoute>
  },
  {
    path: "/admin/car-catalog",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminCarCatalog /></Suspense></AdminRoute>
  },
  {
    path: "/admin/messages",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminMessages /></Suspense></AdminRoute>
  },
  {
    path: "/admin/price-offers",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminPriceOffers /></Suspense></AdminRoute>
  },
  {
    path: "/admin/product-moderation",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminProductModeration /></Suspense></AdminRoute>
  },
  {
    path: "/admin/telegram-monitoring",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminTelegramMonitoring /></Suspense></AdminRoute>
  },
  {
    path: "/admin/help-editor",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminHelpEditor /></Suspense></AdminRoute>
  },
  {
    path: "/admin/synonyms",
    element: <AdminRoute><Suspense fallback={<div>Loading...</div>}><AdminSynonyms /></Suspense></AdminRoute>
  }
];
