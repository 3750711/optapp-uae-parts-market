
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RequestMatchingServiceProps {
  requestId: string;
  requestTitle?: string;
  requestBrand?: string;
  requestModel?: string;
}

/**
 * This component provides real-time monitoring of newly added products
 * and checks if they match with the current request.
 */
export const RequestMatchingService = ({ 
  requestId, 
  requestTitle, 
  requestBrand, 
  requestModel 
}: RequestMatchingServiceProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!requestId || !requestTitle) return;
    
    // Subscribe to real-time updates for new product insertions
    const channel = supabase
      .channel('request-matching')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          // Get the newly added product
          const newProduct = payload.new as any;
          
          if (!newProduct || newProduct.status !== 'active') return;
          
          // Check for match with current request
          const isMatch = checkProductMatch(
            newProduct,
            requestTitle,
            requestBrand,
            requestModel
          );
          
          if (isMatch) {
            toast({
              title: "Найдено новое предложение!",
              description: `Новое предложение "${newProduct.title}" соответствует вашему запросу`,
              duration: 5000,
            });
            
            // Force refetch catalog matches by triggering a window reload
            // This is a simple approach - in a more complex app, you might want to use
            // queryClient.invalidateQueries instead
            window.location.reload();
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, requestTitle, requestBrand, requestModel, toast]);
  
  // Not rendering anything, this is just a service component
  return null;
};

/**
 * Check if a product matches the request criteria
 */
function checkProductMatch(
  product: any, 
  requestTitle?: string,
  requestBrand?: string,
  requestModel?: string
): boolean {
  if (!requestTitle) return false;
  
  // Normalize text for comparison
  const normalizedProductTitle = (product.title || "").trim().toLowerCase();
  const normalizedProductBrand = (product.brand || "").trim().toLowerCase();
  const normalizedProductModel = (product.model || "").trim().toLowerCase();
  
  const normalizedRequestTitle = requestTitle.trim().toLowerCase();
  const normalizedRequestBrand = requestBrand ? requestBrand.trim().toLowerCase() : null;
  const normalizedRequestModel = requestModel ? requestModel.trim().toLowerCase() : null;

  // Check title match (partial match is acceptable)
  const titleMatch = normalizedProductTitle.includes(normalizedRequestTitle) || 
                    normalizedRequestTitle.includes(normalizedProductTitle);
  
  // Brand and model must match exactly if they exist in the request
  const brandMatch = normalizedRequestBrand ? 
                     normalizedProductBrand === normalizedRequestBrand : true;
  
  const modelMatch = normalizedRequestModel ? 
                     normalizedProductModel === normalizedRequestModel : true;

  // Title must match partially, brand and model must match exactly if specified
  return titleMatch && brandMatch && modelMatch;
}

export default RequestMatchingService;
