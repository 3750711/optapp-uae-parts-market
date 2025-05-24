
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
    console.log("Optimistic update for product:", productId, "new primary image:", imageUrl);
    
    // Helper function to update product in any data structure
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

    // Update admin products cache
    queryClient.setQueryData(['admin', 'products'], (oldData: any) => {
      if (!oldData) return oldData;
      
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

    // Update products-infinite cache (for catalog)
    queryClient.setQueryData(['products-infinite'], (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          products: page.products?.map(updateProduct) || []
        }))
      };
    });

    // Update specific product cache
    queryClient.setQueryData(['product', productId], (oldData: any) => {
      if (!oldData) return oldData;
      return updateProduct(oldData);
    });
  };

  const optimisticRemoveImage = (productId: string, imageUrl: string) => {
    console.log("Optimistic remove image for product:", productId, "image:", imageUrl);
    
    // Helper function to remove image from product
    const removeImageFromProduct = (product: any) => {
      if (product.id === productId) {
        const updatedImages = product.product_images?.filter((img: any) => img.url !== imageUrl) || [];
        return {
          ...product,
          product_images: updatedImages
        };
      }
      return product;
    };

    // Update all relevant caches
    ['admin', 'products'].forEach(key => {
      queryClient.setQueryData([key], (oldData: any) => {
        if (!oldData) return oldData;
        
        if (oldData.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              products: page.products?.map(removeImageFromProduct) || []
            }))
          };
        } else if (oldData.products) {
          return {
            ...oldData,
            products: oldData.products.map(removeImageFromProduct)
          };
        }
        
        return oldData;
      });
    });

    // Update products-infinite cache
    queryClient.setQueryData(['products-infinite'], (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          products: page.products?.map(removeImageFromProduct) || []
        }))
      };
    });

    // Update specific product cache
    queryClient.setQueryData(['product', productId], (oldData: any) => {
      if (!oldData) return oldData;
      return removeImageFromProduct(oldData);
    });
  };

  return {
    invalidateAllCaches,
    optimisticUpdateCache,
    optimisticRemoveImage
  };
};
