import React, { useEffect } from "react";
import ModernBuyerDashboard from "@/components/buyer/ModernBuyerDashboard";
import FastProtectedRoute from "@/components/auth/FastProtectedRoute";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const BuyerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <FastProtectedRoute allowedRoles={['buyer']}>
      <ModernBuyerDashboard />
    </FastProtectedRoute>
  );
};

export default BuyerDashboard;