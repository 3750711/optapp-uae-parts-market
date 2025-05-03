
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { Button } from "@/components/ui/button";
import StoreEditForm from "@/components/store/StoreEditForm";
import { useAuth } from "@/contexts/AuthContext";

const SellerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">Личный кабинет продавца</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SellerDashboard />
          </div>
          
          <div className="space-y-6">
            {user && <StoreEditForm sellerId={user.id} />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerProfile;
