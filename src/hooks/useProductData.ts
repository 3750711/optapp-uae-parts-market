
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OrderFormData } from './useOrderForm';

interface UseProductDataProps {
  productId?: string | null;
  onDataLoaded?: (data: Partial<OrderFormData>) => void;
}

export const useProductData = ({ productId, onDataLoaded }: UseProductDataProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      setIsLoading(true);
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('*, seller:profiles!products_seller_id_fkey(opt_id)')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные товара",
            variant: "destructive",
          });
          return;
        }

        if (product) {
          setProductData(product);
          const formData = {
            title: product.title,
            price: product.price.toString(),
            brand: product.brand || "",
            model: product.model || "",
            optid_created: product.optid_created || "",
            seller_opt_id: product.seller?.opt_id || "",
          };
          onDataLoaded?.(formData);
        }
      } catch (error) {
        console.error('Unexpected error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [productId, onDataLoaded]);

  return {
    productData,
    isLoading,
  };
};
