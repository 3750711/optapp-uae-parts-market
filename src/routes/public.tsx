
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

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

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/catalog" element={<Catalog />} />
    <Route path="/product/:id" element={<ProductDetail />} />
    <Route path="/stores" element={<Stores />} />
    <Route path="/store/:id" element={<StoreDetail />} />
    {/* Alias path to support /stores/:id links */}
    <Route path="/stores/:id" element={<StoreDetail />} />
    <Route path="/requests" element={<Requests />} />
    <Route path="/request/:id" element={<RequestDetail />} />
    <Route path="/buyer-guide" element={<BuyerGuide />} />
    <Route path="/public-seller-profile/:id" element={<PublicSellerProfile />} />
    <Route path="/generate-og-image" element={<GenerateOGImage />} />
    <Route path="/404" element={<NotFound />} />
    <Route path="*" element={<NotFound />} />
  </>
);
