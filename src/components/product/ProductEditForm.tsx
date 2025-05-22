
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import ProductForm from "@/components/product/ProductForm";
import ProductMediaManager from "@/components/product/ProductMediaManager";

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
    findBrandIdByName
  } = useCarBrandsAndModels();

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [images, setImages] = React.useState<string[]>(
    Array.isArray(product.product_images)
      ? product.product_images.map((img: any) => img.url)
      : []
  );
  const [videos, setVideos] = React.useState<string[]>(
    Array.isArray(product.product_videos)
      ? product.product_videos.map((vid: any) => vid.url)
      : []
  );
  const [primaryImage, setPrimaryImage] = React.useState<string>(() => {
    if (Array.isArray(product.product_images)) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      return primary ? primary.url : (product.product_images[0]?.url || '');
    }
    return '';
  });

  // Set initial selected brand when the component mounts and brands are loaded
  useEffect(() => {
    if (brands.length > 0 && product.brand) {
      const brandId = findBrandIdByName(product.brand);
      if (brandId) {
        selectBrand(brandId);
      }
    }
  }, [brands, product.brand, findBrandIdByName, selectBrand]);

  React.useEffect(() => {
    setImages(
      Array.isArray(product.product_images) ? product.product_images.map((img: any) => img.url) : []
    );
    setVideos(
      Array.isArray(product.product_videos) ? product.product_videos.map((vid: any) => vid.url) : []
    );
    
    // Set primary image
    if (Array.isArray(product.product_images)) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      setPrimaryImage(primary ? primary.url : (product.product_images[0]?.url || ''));
    }
  }, [product]);

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
    
    const selectedBrand = brands.find(b => b.id === brandId);
    if (selectedBrand) {
      setFormData({
        ...formData,
        brand: selectedBrand.name,
        model: '' // Reset model when brand changes
      });
    }
  };

  // When model changes, update formData
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    
    const selectedModel = brandModels.find(m => m.id === modelId);
    if (selectedModel) {
      setFormData({
        ...formData,
        model: selectedModel.name
      });
    }
  };

  const handleImageUpload = async (newUrls: string[]) => {
    try {
      const imageInserts = newUrls.map(url => ({
        product_id: product.id,
        url: url,
        is_primary: images.length === 0 && primaryImage === '' // First image is primary if no images exist
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      const updatedImages = [...images, ...newUrls];
      setImages(updatedImages);
      
      // If no primary image is set, set the first new image as primary
      if (primaryImage === '' && newUrls.length > 0) {
        setPrimaryImage(newUrls[0]);
      }
      
      toast({
        title: "Фото добавлены",
        description: `Добавлено ${newUrls.length} фотографий`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить фотографии",
        variant: "destructive",
      });
    }
  };

  const handleImageDelete = async (urlToDelete: string) => {
    try {
      setImages(images.filter(url => url !== urlToDelete));
    } catch (error) {
      console.error("Error updating images array after deletion:", error);
    }
  };

  const handlePrimaryImageChange = (imageUrl: string) => {
    setPrimaryImage(imageUrl);
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
      // Handle null model value properly
      const modelValue = formData.model === "" ? null : formData.model;
      
      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          price: formData.price,
          description: formData.description,
          brand: formData.brand,
          model: modelValue, // This can now be null
          place_number: formData.place_number,
          delivery_price: formData.delivery_price,
        })
        .eq("id", product.id);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

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
      className={`bg-white rounded-2xl shadow-md mx-auto w-full flex flex-col ${isMobile ? "gap-2 p-2" : "md:flex-row gap-6 p-4 max-w-3xl"}`}
      style={{
        minHeight: "440px",
        maxWidth: isMobile ? "100vw" : "98vw",
      }}
    >
      <div className={isMobile ? "mb-2 border-b pb-3" : "flex flex-col gap-4 md:w-2/5 w-full border-r-0 md:border-r md:pr-4 md:border-gray-100"}>
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
        />
      </div>

      <div className="flex-1 flex flex-col gap-1 sm:gap-2">
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
