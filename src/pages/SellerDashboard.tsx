
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import OptimizedSellerDashboard from "@/components/seller/OptimizedSellerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGoBack = () => {
    try {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Navigation error:", error);
      navigate('/');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          </div>
          
          <OptimizedSellerDashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SellerDashboard;
