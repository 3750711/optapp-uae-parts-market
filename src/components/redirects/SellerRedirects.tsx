
import React from 'react';
import { Navigate } from 'react-router-dom';

export const SellerCreateOrderRedirect = () => {
  return <Navigate to="/seller/create-order" replace />;
};

export const SellerSellProductRedirect = () => {
  return <Navigate to="/seller/sell-product" replace />;
};

export const SellerProfileRedirect = () => {
  return <Navigate to="/seller/profile" replace />;
};

export const SellerProductsRedirect = () => {
  return <Navigate to="/seller/listings" replace />;
};
