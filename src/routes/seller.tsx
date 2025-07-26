
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
const SellerProductDetail = lazy(() => import('@/pages/SellerProductDetail'));

export const SellerRoutes = () => (
  <>
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
    <Route path="/seller/price-offers" element={
      <ProtectedRoute allowedRoles={['seller']}>
        <SellerPriceOffers />
      </ProtectedRoute>
    } />
    <Route path="/seller/product/:id" element={
      <ProtectedRoute allowedRoles={['seller']}>
        <SellerProductDetail />
      </ProtectedRoute>
    } />
  </>
);
