
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import SellerDashboard from "@/components/seller/SellerDashboard";

const SellerProfile = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/seller/dashboard">
            <Button 
              size="lg" 
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 text-lg py-6 px-8 w-full sm:w-auto"
            >
              <LayoutDashboard className="mr-2 h-6 w-6" />
              Панель продавца
            </Button>
          </Link>
        </div>
        
        <SellerDashboard />
        
        {/* Recent Products */}
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Ваши товары</h3>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">У вас пока нет товаров</p>
              <button className="mt-4 bg-optapp-yellow text-optapp-dark px-4 py-2 rounded font-medium hover:bg-yellow-500">
                Добавить первый товар
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Недавние заказы</h3>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">У вас пока нет заказов</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerProfile;
