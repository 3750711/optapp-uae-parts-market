
import React, { Suspense } from 'react';
import { Loader2 } from "lucide-react";

// Loading component to show while lazy components are loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
      <div className="mt-4 text-gray-500">Загрузка...</div>
    </div>
  </div>
);

// Helper function to create lazy loaded routes with better error handling
export function lazyLoad(importFunc: () => Promise<any>) {
  const LazyComponent = React.lazy(() => {
    return importFunc()
      .catch(error => {
        console.error("Error loading component:", error);
        // Return a module with a default component that shows the error
        return {
          default: () => (
            <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
              <h2 className="text-red-600 text-xl font-bold">Error Loading Component</h2>
              <p className="mt-2 text-gray-600">There was a problem loading this component.</p>
              <p className="mt-2 text-sm text-gray-500">Please try refreshing the page.</p>
            </div>
          )
        };
      });
  });
  
  return () => (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
}

// Pre-defined lazy loaded pages
export const LazyProductDetail = lazyLoad(() => import('../pages/ProductDetail'));
export const LazyCatalog = lazyLoad(() => import('../pages/Catalog'));
export const LazySellerListings = lazyLoad(() => import('../pages/SellerListings'));
export const LazySellerAddProduct = lazyLoad(() => import('../pages/SellerAddProduct'));
export const LazyIndex = lazyLoad(() => import('../pages/Index'));
export const LazySellerRegister = lazyLoad(() => import('../pages/SellerRegister'));
export const LazyPublicSellerProfile = lazyLoad(() => import('../pages/PublicSellerProfile'));
export const LazyBuyerGuide = lazyLoad(() => import('../pages/BuyerGuide'));

// Admin pages
export const LazyAdminDashboard = lazyLoad(() => import('../pages/AdminDashboard'));
export const LazyAdminProducts = lazyLoad(() => import('../pages/AdminProducts'));
export const LazyAdminOrders = lazyLoad(() => import('../pages/AdminOrders'));
export const LazyAdminUsers = lazyLoad(() => import('../pages/AdminUsers'));
export const LazyAdminEvents = lazyLoad(() => import('../pages/AdminEvents'));
export const LazyAdminStores = lazyLoad(() => import('../pages/AdminStores'));
export const LazyAdminCarCatalog = lazyLoad(() => import('../pages/AdminCarCatalog'));
export const LazyAdminAddProduct = lazyLoad(() => import('../pages/AdminAddProduct'));
export const LazyAdminLogistics = lazyLoad(() => import('../pages/AdminLogistics'));
export const LazyAdminImageOptimizer = lazyLoad(() => import('../pages/AdminImageOptimizer'));
export const LazyAdminFreeOrder = lazyLoad(() => import('../pages/AdminFreeOrder'));
