
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Store } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { Button } from "@/components/ui/button";
import StoreEditForm from "@/components/store/StoreEditForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SellerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('seller_id', user.id)
        .maybeSingle();
        
      if (!error && data) {
        setStoreInfo(data);
      }
    };

    fetchStoreInfo();
  }, [user]);

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
            {storeInfo && (
              <Card className="bg-blue-50 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Ваш магазин
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-lg">{storeInfo.name}</div>
                    <div className="text-sm text-gray-600">Управляйте своим магазином и отслеживайте статистику</div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/stores/${storeInfo.id}`}>
                      Просмотреть магазин
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
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
