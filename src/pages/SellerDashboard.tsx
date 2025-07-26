
import React from "react";
import OptimizedSellerDashboard from "@/components/seller/OptimizedSellerDashboard";
import FastProtectedRoute from "@/components/auth/FastProtectedRoute";

const SellerDashboard = () => {
  return (
    <FastProtectedRoute allowedRoles={['seller']}>
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        <OptimizedSellerDashboard />
      </div>
    </FastProtectedRoute>
  );
};

export default SellerDashboard;
