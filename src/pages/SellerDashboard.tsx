
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { useProfile } from "@/contexts/ProfileProvider";
import OptimizedSellerDashboard from "@/components/seller/OptimizedSellerDashboard";
import SimpleProtectedRoute from "@/components/auth/SimpleProtectedRoute";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

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
    <SimpleProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
            <h1 className="text-2xl font-bold">Панель продавца</h1>
          </div>
          
          <OptimizedSellerDashboard />
        </div>
      </Layout>
    </SimpleProtectedRoute>
  );
};

export default SellerDashboard;
