
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import ProductForm from "@/components/product/ProductForm";
import ProductMediaManager from "@/components/product/ProductMediaManager";
import { useQueryClient } from "@tanstack/react-query";

interface ProductEditFormProps {
  product: Product;
  onCancel: () => void;
  onSave: () => void;
  isCreator?: boolean;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
  onCancel,
  onSave,
  isCreator = false,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    title: product.title,
    price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
    description: product.description || "",
    brand: product.brand || "",
    model: product.model || "",
    place_number: product.place_number || 1,
    delivery_price: typeof product.delivery_price === "string" 
      ? parseFloat(product.delivery_price) 
      : product.delivery_price || 0,
  });

  // Use our car brands and models hook
  const { 
    brands, 
    brandModels, 
    selectedBrand, 
    selectBrand, 
    isLoading: loadingBrands,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [images, setImages] = React.useState<string[]>([]);
  const [videos, setVideos] = React.useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = React.useState<string>('');

  // Initialize state from product data
  const initializeState = React.useCallback(() => {
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

    console.log("ProductEditForm - Initializing state:", {
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
        console.log("ProductEditForm - Cache updated for product:", product.id);
        
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

  // Set initial selected brand when the component mounts and brands are loaded
  useEffect(() => {
    if (brands.length > 0 && product.brand) {
      const brandId = findBrandIdByName(product.brand);
      if (brandId) {
        console.log(`Found brand ID ${brandId} for brand name ${product.brand}`);
        selectBrand(brandId);
      } else {
        console.log(`Brand ID not found for name: ${product.brand}`);
      }
    }
  }, [brands, product.brand, findBrandIdByName, selectBrand]);

  // Set initial selected model when brand models are loaded
  useEffect(() => {
    if (selectedBrand && brandModels.length > 0 && product.model) {
      const modelId = findModelIdByName(product.model, selectedBrand);
      if (modelId) {
        console.log(`Found model ID ${modelId} for model name ${product.model} and brand ID ${selectedBrand}`);
        setSelectedModelId(modelId);
      } else {
        console.log(`Model ID not found for name: ${product.model} and brand ID: ${selectedBrand}`);
      }
    }
  }, [brandModels, product.model, selectedBrand, findModelIdByName]);

  React.useEffect(() => {
    const checkIsCreator = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isCreator && (!user || user.id !== product.seller_id)) {
          console.log("User is not the creator of this product");
        }
      } catch (error) {
        console.error("Error checking product ownership:", error);
      }
    };
    checkIsCreator();
  }, [isCreator, product.seller_id]);

  // When brand changes, update formData and reset model
  const handleBrandChange = (brandId: string) => {
    selectBrand(brandId);
    setSelectedModelId(null);
    
    const brandName = findBrandNameById(brandId);
    console.log(`Selected brand ID ${brandId} with name ${brandName}`);
    
    if (brandName) {
      setFormData({
        ...formData,
        brand: brandName,
        model: '' // Reset model when brand changes
      });
    }
  };

  // When model changes, update formData
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    
    const modelName = findModelNameById(modelId);
    console.log(`Selected model ID ${modelId} with name ${modelName}`);
    
    if (modelName) {
      setFormData({
        ...formData,
        model: modelName
      });
    }
  };

  const handleImageUpload = (newUrls: string[]) => {
    console.log("ProductEditForm - handleImageUpload called with:", newUrls);
    const updatedImages = [...images, ...newUrls];
    setImages(updatedImages);
    
    if (primaryImage === '' && newUrls.length > 0) {
      console.log("ProductEditForm - Setting first uploaded image as primary:", newUrls[0]);
      setPrimaryImage(newUrls[0]);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    console.log("ProductEditForm - handleImageDelete called with:", urlToDelete);
    const updatedImages = images.filter(url => url !== urlToDelete);
    setImages(updatedImages);
    
    if (primaryImage === urlToDelete && updatedImages.length > 0) {
      console.log("ProductEditForm - Primary image deleted, setting new primary:", updatedImages[0]);
      setPrimaryImage(updatedImages[0]);
    } else if (updatedImages.length === 0) {
      setPrimaryImage('');
    }
  };

  const handlePrimaryImageChange = (imageUrl: string) => {
    console.log("ProductEditForm - handlePrimaryImageChange called with:", imageUrl);
    setPrimaryImage(imageUrl);
    
    // Unified cache invalidation
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['product', product.id] });
    queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
    
    toast({
      title: "Обновлено",
      description: "Основное фото изменено",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCreator) {
      toast({
        title: "Действие запрещено",
        description: "Только продавец может редактировать объявленые",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const modelValue = formData.model === "" ? null : formData.model;
      
      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          price: formData.price,
          description: formData.description,
          brand: formData.brand,
          model: modelValue,
          place_number: formData.place_number,
          delivery_price: formData.delivery_price,
        })
        .eq("id", product.id);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      // Unified cache invalidation
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['product', product.id] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });

      toast({
        title: "Успешно",
        description: "Объявление обновлено",
      });

      onSave();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить объявление",
        variant: "destructive",
      });
      console.error("Error updating product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-md mx-auto w-full flex flex-col ${isMobile ? "gap-2 p-2" : "md:flex-row gap-6 p-6 max-w-3xl"}`}
      style={{
        minHeight: "440px",
        maxWidth: isMobile ? "100vw" : "98vw",
      }}
    >
      <div className={isMobile ? "mb-2 border-b pb-3" : "flex flex-col gap-4 md:w-2/5 w-full border-r-0 md:border-r md:pr-6 md:border-gray-100"}>
        <ProductMediaManager
          productId={product.id}
          images={images}
          videos={videos}
          onImageUpload={handleImageUpload}
          onImageDelete={handleImageDelete}
          onVideosChange={isCreator ? setVideos : () => {}}
          onPrimaryImageChange={isCreator ? handlePrimaryImageChange : undefined}
          primaryImage={primaryImage}
          maxImages={25}
          storageBucket="Product Images"
        />
      </div>

      <div className="flex-1 flex flex-col gap-3 sm:gap-4">
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          brands={brands}
          brandModels={brandModels}
          selectedBrand={selectedBrand}
          handleBrandChange={handleBrandChange}
          handleModelChange={handleModelChange}
          selectedModelId={selectedModelId}
          loadingBrands={loadingBrands}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          isCreator={isCreator}
        />
      </div>
    </div>
  );
};

export default ProductEditForm;
