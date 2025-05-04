
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
    
    console.log("RequestMatchingService initialized with:", {
      requestId,
      requestTitle,
      requestBrand,
      requestModel
    });
    
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
          
          if (!newProduct || newProduct.status !== 'active') {
            console.log("Product skipped - not active:", newProduct?.status);
            return;
          }
          
          console.log("New product detected:", {
            title: newProduct.title,
            brand: newProduct.brand,
            model: newProduct.model,
            status: newProduct.status
          });
          
          // Check for match with current request
          const isMatch = checkProductMatch(
            newProduct,
            requestTitle,
            requestBrand,
            requestModel
          );
          
          if (isMatch) {
            console.log("Match found for request!", {
              productTitle: newProduct.title,
              requestTitle
            });
            
            toast({
              title: "Найдено новое предложение!",
              description: `Новое предложение "${newProduct.title}" соответствует вашему запросу`,
              duration: 5000,
            });
            
            // Force refetch catalog matches by triggering a window reload
            // This is a simple approach - in a more complex app, you might want to use
            // queryClient.invalidateQueries instead
            window.location.reload();
          } else {
            console.log("No match for request", {
              productTitle: newProduct.title,
              requestTitle,
              productBrand: newProduct.brand,
              requestBrand,
              productModel: newProduct.model,
              requestModel
            });
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
 * Check if a product matches the request criteria with enhanced logic
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
  
  // Brand match - check for exact match first, then partial match if no exact match
  let brandMatch = true; // Default to true if no brand specified
  if (normalizedRequestBrand) {
    brandMatch = normalizedProductBrand === normalizedRequestBrand || 
                normalizedProductBrand.includes(normalizedRequestBrand) || 
                normalizedRequestBrand.includes(normalizedProductBrand);
  }
  
  // Model match - check for exact match first, then partial match if no exact match
  let modelMatch = true; // Default to true if no model specified
  if (normalizedRequestModel) {
    modelMatch = normalizedProductModel === normalizedRequestModel || 
                normalizedProductModel.includes(normalizedRequestModel) || 
                normalizedRequestModel.includes(normalizedProductModel);
  }

  // Must match on all criteria
  const isMatch = titleMatch && brandMatch && modelMatch;
  
  console.log("Match check:", { 
    titleMatch, 
    brandMatch, 
    modelMatch,
    result: isMatch
  });

  return isMatch;
}

export default RequestMatchingService;
