
import React from "react";
import Layout from "@/components/layout/Layout";
import { Suspense, lazy } from 'react';
import SellerListingsErrorBoundary from "@/components/seller/SellerListingsErrorBoundary";
import EnhancedSellerListingsSkeleton from "@/components/seller/EnhancedSellerListingsSkeleton";

// Lazy load the SellerListingsContent component
const SellerListingsContent = lazy(() => import('@/components/seller/SellerListingsContent'));

const SellerListings = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SellerListingsErrorBoundary>
          <Suspense fallback={<EnhancedSellerListingsSkeleton />}>
            <SellerListingsContent />
          </Suspense>
        </SellerListingsErrorBoundary>
      </div>
    </Layout>
  );
};

export default SellerListings;
