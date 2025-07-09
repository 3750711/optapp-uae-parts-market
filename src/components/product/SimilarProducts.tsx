import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SellerProductsProps {
  currentProductId: string;
  sellerId: string;
  sellerName?: string;
}

const SellerProducts: React.FC<SellerProductsProps> = ({
  currentProductId,
  sellerId,
  sellerName
}) => {
  const navigate = useNavigate();
  
  // Получаем общее количество товаров у продавца
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['seller-products-count', sellerId, currentProductId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .neq('id', currentProductId);
      
      if (error) {
        console.error('Error fetching seller products count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!sellerId && !!currentProductId,
  });

  const { data: sellerProducts = [], isLoading } = useQuery({
    queryKey: ['seller-products', sellerId, currentProductId],
    queryFn: async () => {
      // Get other products from the same seller
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(
            id,
            url,
            is_primary
          )
        `)
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .neq('id', currentProductId)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('Error fetching seller products:', error);
        return [];
      }

      // Process the data to ensure proper image arrays per product
      const processedData = data?.map(product => ({
        ...product,
        product_images: product.product_images || []
      })) || [];

      return processedData;
    },
    enabled: !!sellerId && !!currentProductId,
  });

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 px-4">Другие товары продавца</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sellerProducts.length) {
    return null;
  }

  return (
    <div className="mt-6 bg-white">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-foreground">
          Другие товары {sellerName ? `от ${sellerName}` : 'продавца'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {totalCount > 6 ? `Показано 6 из ${totalCount}` : `${sellerProducts.length}`} {
            totalCount === 1 ? 'товар' : 
            totalCount < 5 ? 'товара' : 'товаров'
          } в наличии
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sellerProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product as Product}
            />
          ))}
        </div>
        
        {totalCount > 6 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/seller/${sellerId}`)}
              className="w-full md:w-auto"
            >
              Показать все объявления продавца ({totalCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;