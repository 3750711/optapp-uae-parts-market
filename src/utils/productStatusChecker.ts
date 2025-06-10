
import { supabase } from '@/integrations/supabase/client';

export const checkProductStatus = async (productId: string): Promise<{
  isAvailable: boolean;
  status: string;
}> => {
  try {
    const { data: currentProduct, error } = await supabase
      .from('products')
      .select('status')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Error checking product status:', error);
      throw error;
    }
    
    return {
      isAvailable: currentProduct.status === 'active',
      status: currentProduct.status
    };
  } catch (error) {
    console.error('Unexpected error checking product status:', error);
    throw error;
  }
};
