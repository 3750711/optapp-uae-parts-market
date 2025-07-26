
import React, { useEffect } from "react";
import FastSellerDashboard from "@/components/seller/FastSellerDashboard";
import FastProtectedRoute from "@/components/auth/FastProtectedRoute";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const SellerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <FastProtectedRoute allowedRoles={['seller']}>
      <div className="container mx-auto px-4 py-8">
        <FastSellerDashboard />
      </div>
    </FastProtectedRoute>
  );
};

export default SellerDashboard;
