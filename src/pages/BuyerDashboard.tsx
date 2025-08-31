import React, { useEffect } from "react";
import FastBuyerDashboard from "@/components/buyer/FastBuyerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const BuyerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <FastBuyerDashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default BuyerDashboard;