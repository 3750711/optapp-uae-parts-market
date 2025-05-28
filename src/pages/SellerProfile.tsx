
import React, { useEffect, useState, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Store, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import SellerPageSkeleton from "@/components/seller/SellerPageSkeleton";
import OptimizedSellerDashboard from "@/components/seller/OptimizedSellerDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SellerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fixed back button functionality
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

  // Optimized store info query with React Query
  const { 
    data: storeInfo, 
    isLoading: isStoreLoading, 
    error: storeError,
    refetch: refetchStore 
  } = useQuery({
    queryKey: ['seller-store-info', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, description, verified')
        .eq('seller_id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle retry for store info
  const handleRetryStore = () => {
    refetchStore();
    toast({
      title: "Обновление данных",
      description: "Загружаем информацию о магазине...",
    });
  };

  // Loading state
  if (isStoreLoading && !storeInfo) {
    return (
      <Layout>
        <SellerPageSkeleton />
      </Layout>
    );
  }

  return (
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
          <h1 className="text-2xl font-bold">Личный кабинет продавца</h1>
        </div>
        
        <div className="space-y-6">
          {/* Store info section with error handling */}
          {storeError ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="flex items-center justify-between">
                <span>Не удалось загрузить информацию о магазине</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetryStore}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Повторить
                </Button>
              </AlertDescription>
            </Alert>
          ) : storeInfo ? (
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Ваш магазин
                  {storeInfo.verified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Проверен
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <div className="font-medium text-lg">{storeInfo.name}</div>
                  <div className="text-sm text-gray-600">
                    {storeInfo.description || "Управляйте своим магазином и отслеживайте статистику"}
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link to={`/stores/${storeInfo.id}`}>
                    Просмотреть магазин
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Dashboard section */}
          <OptimizedSellerDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default SellerProfile;
