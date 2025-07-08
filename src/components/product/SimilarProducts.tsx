import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarProductsProps {
  currentProductId: string;
  brand?: string;
  model?: string;
  sellerId: string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProductId,
  brand,
  model,
  sellerId
}) => {
  const { data: similarProducts = [], isLoading } = useQuery({
    queryKey: ['similar-products', currentProductId, brand, model],
    queryFn: async () => {
      // First try to find products with same brand and model
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary)
        `)
        .eq('status', 'active')
        .neq('id', currentProductId)
        .limit(4);

      if (brand && model) {
        query = query.eq('brand', brand).eq('model', model);
      } else if (brand) {
        query = query.eq('brand', brand);
      } else {
        // Fallback: get other products from same seller
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching similar products:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentProductId,
  });

  if (isLoading) {
    return (
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-6">Похожие товары</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similarProducts.length) {
    return null;
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-6 text-foreground">
        {brand && model ? `Другие ${brand} ${model}` : brand ? `Другие ${brand}` : 'Похожие товары'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product as Product}
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;