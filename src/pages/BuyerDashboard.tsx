import React, { useEffect } from "react";
import FastBuyerDashboard from "@/components/buyer/FastBuyerDashboard";
import FastProtectedRoute from "@/components/auth/FastProtectedRoute";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const BuyerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <FastProtectedRoute allowedRoles={['buyer']}>
      <div className="container mx-auto px-4 py-8">
        <FastBuyerDashboard />
      </div>
    </FastProtectedRoute>
  );
};

export default BuyerDashboard;