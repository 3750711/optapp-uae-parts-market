
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseProductDataProps {
  productId?: string | null;
  onDataLoaded: (data: any) => void;
}

export const useProductData = ({ productId, onDataLoaded }: UseProductDataProps) => {
  useEffect(() => {
    if (!productId) return;

    const loadProductData = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('Error loading product data:', error);
          return;
        }

        if (data) {
          onDataLoaded({
            title: data.title,
            price: data.price?.toString() || '',
            description: data.description || '',
            brand: data.brand || '',
            model: data.model || '',
            brandId: data.brand_id || '',
            modelId: data.model_id || '',
            delivery_price: data.delivery_price?.toString() || '',
            place_number: data.place_number?.toString() || '1'
          });
        }
      } catch (error) {
        console.error('Error loading product data:', error);
      }
    };

    loadProductData();
  }, [productId, onDataLoaded]);
};
