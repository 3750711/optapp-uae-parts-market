
import React, { useEffect } from "react";
import FastSellerDashboard from "@/components/seller/FastSellerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { initMobileOptimizations } from "@/utils/mobileOptimizations";

const SellerDashboard = () => {
  useEffect(() => {
    initMobileOptimizations();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="container mx-auto px-4 py-8">
        <FastSellerDashboard />
      </div>
    </ProtectedRoute>
  );
};

export default SellerDashboard;
