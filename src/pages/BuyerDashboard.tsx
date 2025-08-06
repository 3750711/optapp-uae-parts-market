import React, { useEffect } from "react";
import FastBuyerDashboard from "@/components/buyer/FastBuyerDashboard";
import FastProtectedRoute from "@/components/auth/FastProtectedRoute";
import Layout from "@/components/layout/Layout";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const BuyerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <FastProtectedRoute allowedRoles={['buyer']}>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <FastBuyerDashboard />
        </div>
      </Layout>
    </FastProtectedRoute>
  );
};

export default BuyerDashboard;