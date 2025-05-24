
import { useQueryClient } from "@tanstack/react-query";

export const useImageCacheManager = () => {
  const queryClient = useQueryClient();

  const invalidateAllCaches = (productId: string) => {
    console.log("Invalidating all product caches for:", productId);
    
    // Invalidate all related cache keys
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
    
    // Also refetch specific product data to ensure immediate updates
    queryClient.refetchQueries({ queryKey: ['product', productId] });
  };

  const optimisticUpdateCache = (productId: string, imageUrl: string) => {
    // Optimistic update for admin products cache
    queryClient.setQueryData(['admin', 'products'], (oldData: any) => {
      if (!oldData) return oldData;
      
      // Update the product in the cache optimistically
      const updateProduct = (product: any) => {
        if (product.id === productId) {
          return {
            ...product,
            product_images: product.product_images?.map((img: any) => ({
              ...img,
              is_primary: img.url === imageUrl
            })) || []
          };
        }
        return product;
      };

      if (oldData.pages) {
        // For infinite query structure
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            products: page.products?.map(updateProduct) || []
          }))
        };
      } else if (oldData.products) {
        // For regular query structure
        return {
          ...oldData,
          products: oldData.products.map(updateProduct)
        };
      }
      
      return oldData;
    });
  };

  return {
    invalidateAllCaches,
    optimisticUpdateCache
  };
};
