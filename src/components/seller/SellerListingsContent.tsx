import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { ProductProps } from "@/components/product/ProductCard";

const SellerListingsContent = () => {
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, is_primary)')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user?.id,
  });

  // Map database products to the format expected by ProductCard
  const mappedProducts: ProductProps[] = products?.map(product => {
    // Find the primary image or use the first one
    const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                         product.product_images?.[0]?.url || 
                         '/placeholder.svg';
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: primaryImage,
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

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Мои объявления</h1>
        <Badge variant="outline" className="text-lg">
          Всего: {mappedProducts.length}
        </Badge>
      </div>
      {mappedProducts.length > 0 ? (
        <ProductGrid products={mappedProducts} />
      ) : (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">У вас пока нет объявлений</p>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
