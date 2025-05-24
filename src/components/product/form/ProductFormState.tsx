
import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types/product";

interface UseProductFormStateProps {
  product: Product;
}

export const useProductFormState = ({ product }: UseProductFormStateProps) => {
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

  return {
    images,
    videos,
    primaryImage,
    setImages,
    setVideos,
    setPrimaryImage
  };
};
