
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";

const SellerListingsContent = () => {
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Мои объявления</h1>
        <Badge variant="outline" className="text-lg">
          Всего: {products?.length || 0}
        </Badge>
      </div>
      {products && products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">У вас пока нет объявлений</p>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
