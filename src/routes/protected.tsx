
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loaded защищенные страницы
const Profile = lazy(() => import('@/pages/Profile'));
const CreateStore = lazy(() => import('@/pages/CreateStore'));
const CreateRequest = lazy(() => import('@/pages/CreateRequest'));
const BuyerOrders = lazy(() => import('@/pages/BuyerOrders'));
const BuyerCreateOrder = lazy(() => import('@/pages/BuyerCreateOrder'));
const OrderDetails = lazy(() => import('@/pages/OrderDetails'));

// Специальные компоненты для редиректов
const OrdersRedirect = lazy(() => import('@/pages/OrdersRedirect'));

export const ProtectedRoutes = () => (
  <>
    <Route path="/profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />
    <Route path="/create-store" element={
      <ProtectedRoute requireEmailVerification={true}>
        <CreateStore />
      </ProtectedRoute>
    } />
    <Route path="/create-request" element={
      <ProtectedRoute requireEmailVerification={true}>
        <CreateRequest />
      </ProtectedRoute>
    } />
    <Route path="/buyer-orders" element={
      <ProtectedRoute>
        <BuyerOrders />
      </ProtectedRoute>
    } />
    <Route path="/buyer-create-order" element={
      <ProtectedRoute requireEmailVerification={true}>
        <BuyerCreateOrder />
      </ProtectedRoute>
    } />
    <Route path="/order-details/:id" element={
      <ProtectedRoute>
        <OrderDetails />
      </ProtectedRoute>
    } />
    <Route path="/orders" element={
      <ProtectedRoute>
        <OrdersRedirect />
      </ProtectedRoute>
    } />
  </>
);
