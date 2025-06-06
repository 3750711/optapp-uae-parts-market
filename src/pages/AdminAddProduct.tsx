
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import OptimizedAddProductForm, { productSchema, ProductFormValues } from "@/components/product/OptimizedAddProductForm";

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand 
  } = useCarBrandsAndModels();

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "0",
    },
    mode: "onChange",
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // When title changes, try to detect brand and model
  useEffect(() => {
    if (watchTitle && brands.length > 0 && !watchBrandId) {
      const { brandId, modelId } = parseProductTitle(watchTitle);
      
      if (brandId) {
        form.setValue("brandId", brandId);
        
        if (modelId) {
          form.setValue("modelId", modelId);
        }

        toast({
          title: "Авто обнаружено",
          description: "Марка и модель автомобиля определены из названия",
        });
      }
    }
  }, [watchTitle, brands, brandModels, parseProductTitle, form, watchBrandId, toast]);

  // When brand changes, reset model selection and update models list
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      if (watchModelId) {
        const modelBelongsToBrand = validateModelBrand(watchModelId, watchBrandId);
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }
  }, [watchBrandId, selectBrand, form, validateModelBrand, watchModelId]);

  // Validate model when brandModels change
  useEffect(() => {
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [brandModels, watchModelId, form]);

  const handleMobileOptimizedImageUpload = (urls: string[]) => {
    console.log('📷 New images uploaded:', {
      urls,
      existingCount: imageUrls.length,
      timestamp: new Date().toISOString()
    });
    
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    // Set default primary image if none is selected yet
    if (!primaryImage && urls.length > 0) {
      console.log('🎯 Setting primary image:', urls[0]);
      setPrimaryImage(urls[0]);
    }
  };

  const removeImage = (url: string) => {
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    // If deleted image was primary, set new primary
    if (primaryImage === url) {
      if (newImageUrls.length > 0) {
        setPrimaryImage(newImageUrls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  };

  // Updated product creation using RPC functions
  const createProduct = async (values: ProductFormValues) => {
    console.log('🚀 Создание товара с параметрами:', values);
    
    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get brand and model names for the database
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      
      // Model is optional
      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      if (!selectedBrand) {
        toast({
          title: "Ошибка",
          description: "Выбранная марка не найдена",
          variant: "destructive",
        });
        return;
      }

      console.log('🏭 Creating product using RPC function...', {
        title: values.title,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        timestamp: new Date().toISOString()
      });
      
      // Create product using admin RPC function
      const { data: productId, error: productError } = await supabase.rpc('admin_create_product', {
        p_title: values.title,
        p_price: parseFloat(values.price),
        p_condition: "Новый",
        p_brand: selectedBrand.name,
        p_model: modelName,
        p_description: values.description || null,
        p_seller_id: null, // Admin creates products without specific seller
        p_seller_name: "Admin",
        p_status: 'active',
        p_place_number: parseInt(values.placeNumber),
        p_delivery_price: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0,
      });

      if (productError) {
        console.error("Error creating product:", productError);
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      if (!productId) {
        throw new Error("Product creation returned no ID");
      }

      console.log('✅ Product created with ID:', productId);

      // Add images using admin RPC function
      for (const url of imageUrls) {
        const { error: imageError } = await supabase.rpc('admin_insert_product_image', {
          p_product_id: productId,
          p_url: url,
          p_is_primary: url === primaryImage
        });
          
        if (imageError) {
          console.error('Error adding image:', imageError);
          toast({
            title: "Предупреждение",
            description: `Не удалось добавить изображение: ${imageError.message}`,
            variant: "destructive",
          });
        }
      }

      // Add videos using admin RPC function if any
      if (videoUrls.length > 0) {
        for (const videoUrl of videoUrls) {
          const { error: videoError } = await supabase.rpc('admin_insert_product_video', {
            p_product_id: productId,
            p_url: videoUrl
          });
            
          if (videoError) {
            console.error('Error adding video:', videoError);
            toast({
              title: "Предупреждение",
              description: `Не удалось добавить видео: ${videoError.message}`,
              variant: "destructive",
            });
          }
        }
      }

      // Send notification
      try {
        supabase.functions.invoke('send-telegram-notification', {
          body: { productId: productId }
        }).catch(notifyError => {
          console.error("Error sending notification:", notifyError);
        });
      } catch (notifyError) {
        console.warn("Error sending notification:", notifyError);
      }

      toast({
        title: "Товар создан",
        description: "Товар успешно опубликован",
      });

      navigate(`/product/${productId}`);
    } catch (error) {
      console.error("Error creating product:", error);
      
      let errorMessage = "Не удалось создать товар. Попробуйте позже.";
      
      if (error instanceof Error) {
        if (error.message.includes('Only admins can use this function')) {
          errorMessage = "У вас нет прав администратора для создания товаров.";
        } else if (error.message.includes('Failed to create product')) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <OptimizedAddProductForm
            form={form}
            onSubmit={createProduct}
            isSubmitting={isSubmitting}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            brands={brands}
            brandModels={brandModels}
            isLoadingCarData={isLoadingCarData}
            watchBrandId={watchBrandId}
            searchBrandTerm={searchBrandTerm}
            setSearchBrandTerm={setSearchBrandTerm}
            searchModelTerm={searchModelTerm}
            setSearchModelTerm={setSearchModelTerm}
            handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
            setVideoUrls={setVideoUrls}
            primaryImage={primaryImage}
            setPrimaryImage={setPrimaryImage}
            onImageDelete={removeImage}
            showSellerSelect={false}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
