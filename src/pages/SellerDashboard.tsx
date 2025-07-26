
import React from "react";
import OptimizedSellerDashboard from "@/components/seller/OptimizedSellerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const SellerDashboard = () => {

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="container mx-auto px-4 py-8">
        <OptimizedSellerDashboard />
      </div>
    </ProtectedRoute>
  );
};

export default SellerDashboard;
