
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Star } from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { ProductProps } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PublicSellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["seller-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(url, is_primary)")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const mappedProducts: ProductProps[] = products?.map(product => {
    const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                        product.product_images?.[0]?.url || 
                        '/placeholder.svg';
    
    let condition: "Новый" | "Б/У" | "Восстановленный" = "Б/У";
    
    if (product.condition === "Новый" || product.condition === "Восстановленный") {
      condition = product.condition as "Новый" | "Восстановленный";
    }
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: primaryImage,
      condition: condition,
      location: product.location || '',
      brand: product.brand || '',
      model: product.model || '',
      seller_name: product.seller_name,
      status: product.status,
      seller_rating: product.rating_seller,
      optid_created: product.optid_created,
      seller_id: product.seller_id
    };
  }) || [];

  if (isProfileLoading || isProductsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-red-500">Продавец не найден</p>
        </div>
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
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {profile.avatar_url && (
              <div className="flex-shrink-0">
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || "Продавец"} 
                  className="w-32 h-32 rounded-full object-cover"
                />
              </div>
            )}
            <div className="flex-grow">
              <h1 className="text-2xl font-bold mb-4">{profile.full_name || "Продавец"}</h1>
              
              {profile.description_user && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">О продавце</h3>
                  <p className="text-gray-700">{profile.description_user}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {profile.opt_id && (
                  <div className="text-sm">
                    <span className="text-gray-500">OPT ID: </span>
                    <span className="font-medium">{profile.opt_id}</span>
                  </div>
                )}
                
                {profile.rating !== null && (
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(profile.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm">
                      <span className="font-medium">{profile.rating?.toFixed(1)}</span>
                      <span className="text-gray-500"> / 5</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {profile.company_name && (
                  <p className="text-gray-600">
                    <span className="font-medium">Компания: </span>
                    {profile.company_name}
                  </p>
                )}
                {profile.telegram && (
                  <p className="text-gray-600">
                    <span className="font-medium">Telegram: </span>
                    {profile.telegram}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Объявления продавца</h2>
            <Badge variant="outline" className="text-lg">
              Всего: {mappedProducts.length}
            </Badge>
          </div>
          
          {mappedProducts.length > 0 ? (
            <ProductGrid products={mappedProducts} />
          ) : (
            <p className="text-center py-8 text-gray-500">
              У продавца пока нет активных объявлений
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PublicSellerProfile;
