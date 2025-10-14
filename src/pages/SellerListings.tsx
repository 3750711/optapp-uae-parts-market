import React from "react";
import { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import SellerListingsErrorBoundary from "@/components/seller/SellerListingsErrorBoundary";
import EnhancedSellerListingsSkeleton from "@/components/seller/EnhancedSellerListingsSkeleton";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerListingsPageTranslations } from '@/utils/translations/sellerListingsPage';
import Layout from "@/components/layout/Layout";
import BackButton from "@/components/navigation/BackButton";

// Lazy load the SellerListingsContent component
const SellerListingsContent = lazy(() => import('@/components/seller/SellerListingsContent'));

const SellerListings = () => {
  const { language } = useLanguage();
  const t = getSellerListingsPageTranslations(language);

  return (
    <Layout language={language}>
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>{t.metaTitle}</title>
          <meta name="description" content={t.metaDescription} />
          <link rel="canonical" href="/seller/listings" />
        </Helmet>
        <BackButton className="mb-4" fallback="/seller/dashboard" />
        <SellerListingsErrorBoundary language={language}>
          <Suspense fallback={<EnhancedSellerListingsSkeleton />}>
            <SellerListingsContent />
          </Suspense>
        </SellerListingsErrorBoundary>
      </div>
    </Layout>
  );
};

export default SellerListings;
