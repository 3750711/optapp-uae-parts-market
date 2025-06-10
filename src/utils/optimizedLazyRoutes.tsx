
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Компактный fallback для загрузки
const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
  </div>
);

// Критические компоненты загружаем сразу (без lazy)
export { default as Index } from '@/pages/Index';
export { default as ProductDetail } from '@/pages/OptimizedProductDetail';
export { default as Catalog } from '@/pages/Catalog';
export { default as Login } from '@/pages/Login';
export { default as Register } from '@/pages/Register';

// Часто используемые компоненты - предзагружаем
const Profile = React.lazy(() => 
  import('@/pages/Profile').then(module => ({ default: module.default }))
);
const BuyerOrders = React.lazy(() => 
  import('@/pages/BuyerOrders').then(module => ({ default: module.default }))
);
const SellerOrders = React.lazy(() => 
  import('@/pages/SellerOrders').then(module => ({ default: module.default }))
);

// Предзагружаем при загрузке модуля
setTimeout(() => {
  import('@/pages/Profile');
  import('@/pages/BuyerOrders');
  import('@/pages/SellerOrders');
}, 1000);

// Обернутые в Suspense компоненты
export const LazyProfile = () => (
  <Suspense fallback={<LazyFallback />}>
    <Profile />
  </Suspense>
);

export const LazyBuyerOrders = () => (
  <Suspense fallback={<LazyFallback />}>
    <BuyerOrders />
  </Suspense>
);

export const LazySellerOrders = () => (
  <Suspense fallback={<LazyFallback />}>
    <SellerOrders />
  </Suspense>
);

// Админские страницы - оставляем lazy loading
export const LazyAdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
export const LazyAdminUsers = React.lazy(() => import('@/pages/AdminUsers'));
export const LazyAdminProducts = React.lazy(() => import('@/pages/AdminProducts'));
export const LazyAdminOrders = React.lazy(() => import('@/pages/AdminOrders'));

// Остальные страницы
export const LazyAbout = React.lazy(() => import('@/pages/About'));
export const LazyContact = React.lazy(() => import('@/pages/Contact'));
export const LazyStores = React.lazy(() => import('@/pages/Stores'));
export const LazySellerDashboard = React.lazy(() => import('@/pages/SellerDashboard'));
export const LazySellerListings = React.lazy(() => import('@/pages/SellerListings'));
export const LazyCreateStore = React.lazy(() => import('@/pages/CreateStore'));

// Обертка для админских компонентов с улучшенным fallback
export const AdminSuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Загрузка панели администратора...</p>
      </div>
    </div>
  }>
    {children}
  </Suspense>
);
