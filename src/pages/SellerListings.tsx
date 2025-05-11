
import React from "react";
import Layout from "@/components/layout/Layout";
import { Suspense, lazy } from 'react';
import { Loader2 } from "lucide-react";

// Lazy load the SellerListingsContent component
const SellerListingsContent = lazy(() => import('@/components/seller/SellerListingsContent'));

const SellerListingsLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
  </div>
);

const SellerListings = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<SellerListingsLoadingFallback />}>
          <SellerListingsContent />
        </Suspense>
      </div>
    </Layout>
  );
};

export default SellerListings;
