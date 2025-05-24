
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types/product";

interface UseProductFormStateProps {
  product: Product;
}

export const useProductFormState = ({ product }: UseProductFormStateProps) => {
  const queryClient = useQueryClient();
  
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>('');

  // Initialize state from product data
  const initializeState = useCallback(() => {
    const newImages = Array.isArray(product.product_images)
      ? product.product_images.map((img: any) => img.url)
      : [];
    
    const newVideos = Array.isArray(product.product_videos)
      ? product.product_videos.map((vid: any) => vid.url)
      : [];
    
    let newPrimaryImage = '';
    if (Array.isArray(product.product_images)) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      newPrimaryImage = primary ? primary.url : (product.product_images[0]?.url || '');
    }

    console.log("ProductFormState - Initializing state:", {
      newImages: newImages.length,
      newPrimaryImage,
      productId: product.id
    });

    setImages(newImages);
    setVideos(newVideos);
    setPrimaryImage(newPrimaryImage);
  }, [product]);

  // Initialize state when product changes
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Listen for cache updates and sync local state
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'product' && event?.query?.queryKey?.[1] === product.id) {
        console.log("ProductFormState - Cache updated for product:", product.id);
        
        // Get fresh data from cache and sync
        const freshProduct = queryClient.getQueryData(['product', product.id]) as Product;
        if (freshProduct && event.type === 'updated') {
          const freshImages = Array.isArray(freshProduct.product_images)
            ? freshProduct.product_images.map((img: any) => img.url)
            : [];
          
          let freshPrimaryImage = '';
          if (Array.isArray(freshProduct.product_images)) {
            const primary = freshProduct.product_images.find((img: any) => img.is_primary);
            freshPrimaryImage = primary ? primary.url : (freshProduct.product_images[0]?.url || '');
          }

          // Only update if data actually changed
          setImages(prev => {
            const hasChanged = prev.length !== freshImages.length || 
              prev.some((img, index) => img !== freshImages[index]);
            return hasChanged ? freshImages : prev;
          });

          setPrimaryImage(prev => prev !== freshPrimaryImage ? freshPrimaryImage : prev);
        }
      }
    });

    return unsubscribe;
  }, [product.id, queryClient]);

  return {
    images,
    videos,
    primaryImage,
    setImages,
    setVideos,
    setPrimaryImage
  };
};
