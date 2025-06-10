
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
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import OptimizedAddProductForm, { ProductFormValues } from "@/components/product/OptimizedAddProductForm";

// Admin product schema with required sellerId
const adminProductSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  price: z.string().min(1, {
    message: "Укажите цену товара",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть положительным числом",
  }),
  brandId: z.string().min(1, {
    message: "Выберите марку автомобиля",
  }),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
  sellerId: z.string().min(1, {
    message: "Выберите продавца",
  }),
});

type AdminProductFormValues = z.infer<typeof adminProductSchema>;

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellers, setSellers] = useState<{ id: string; full_name: string }[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    allModels,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand 
  } = useCarBrandsAndModels();

  // Initialize form first
  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "0",
      sellerId: "",
    },
    mode: "onChange",
  });

  // Get models for currently selected brand
  const getModelsForBrand = React.useCallback((brandId: string) => {
    if (!brandId || !allModels) return [];
    return allModels.filter(model => model.brand_id === brandId);
  }, [allModels]);

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    getModelsForBrand(form.watch("brandId") || ""),
    findBrandIdByName,
    findModelIdByName
  );

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
  }, [watchTitle, brands, parseProductTitle, form, watchBrandId, toast]);

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_type', 'seller')
        .order('full_name');

      if (error) {
        console.error("Error fetching sellers:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список продавцов",
          variant: "destructive",
        });
        return;
      }

      setSellers(data || []);
    };

    fetchSellers();
  }, [toast]);

  // When brand changes, reset model selection if needed
  useEffect(() => {
    if (watchBrandId && watchModelId) {
      const modelBelongsToBrand = validateModelBrand(watchModelId, watchBrandId);
      if (!modelBelongsToBrand) {
        form.setValue("modelId", "");
      }
    }
  }, [watchBrandId, form, validateModelBrand, watchModelId]);

  // Validate model when brand changes
  useEffect(() => {
    if (watchModelId && watchBrandId) {
      const currentBrandModels = getModelsForBrand(watchBrandId);
      const modelExists = currentBrandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [watchBrandId, watchModelId, form, getModelsForBrand]);

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

  // Enhanced product creation with Cloudinary data (no preview generation)
  const createProduct = async (values: AdminProductFormValues) => {
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
      
      // Get selected seller
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
      // Model is optional
      let modelName = null;
      if (values.modelId) {
        const selectedModel = getModelsForBrand(values.brandId).find(model => model.id === values.modelId);
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

      if (!selectedSeller) {
        toast({
          title: "Ошибка",
          description: "Выбранный продавец не найден",
          variant: "destructive",
        });
        return;
      }

      console.log('🏭 Creating product with images...', {
        title: values.title,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        sellerId: values.sellerId,
        sellerName: selectedSeller.full_name,
        primaryImage,
        timestamp: new Date().toISOString()
      });
      
      // Create product using standard Supabase insert (RLS now allows admin to create for any seller)
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: parseFloat(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: values.sellerId,
          seller_name: selectedSeller.full_name,
          status: 'active',
          place_number: parseInt(values.placeNumber),
          delivery_price: values.deliveryPrice ? parseFloat(values.deliveryPrice) : 0,
        })
        .select()
        .single();

      if (productError) {
        console.error("Error creating product:", productError);
        throw productError;
      }

      console.log('✅ Product created:', product.id);

      // Add images
      for (const url of imageUrls) {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: url,
            is_primary: url === primaryImage
          });
          
        if (imageError) {
          console.error('Error adding image:', imageError);
        }
      }

      // Extract public_id from primary image and update product with Cloudinary data (no preview)
      if (primaryImage) {
        try {
          console.log('🎨 Extracting public_id from primary image:', primaryImage);
          const publicIdMatch = primaryImage.match(/\/v\d+\/(.+?)(?:\.|$)/);
          const publicId = publicIdMatch ? publicIdMatch[1] : null;
          
          if (publicId) {
            console.log('📸 Updating product with Cloudinary data:', {
              productId: product.id,
              publicId,
              cloudinaryUrl: primaryImage
            });

            // Update product with Cloudinary data (no preview URL)
            const { error: updateError } = await supabase
              .from('products')
              .update({
                cloudinary_public_id: publicId,
                cloudinary_url: primaryImage
              })
              .eq('id', product.id);

            if (updateError) {
              console.error('❌ Error updating product with Cloudinary data:', updateError);
            } else {
              console.log('✅ Product updated with Cloudinary data');
            }
          } else {
            console.warn('⚠️ Could not extract public_id from primary image URL');
          }
        } catch (error) {
          console.error('💥 Error processing Cloudinary data:', error);
        }
      }

      // Add videos if any
      if (videoUrls.length > 0) {
        for (const videoUrl of videoUrls) {
          const { error: videoError } = await supabase
            .from('product_videos')
            .insert({
              product_id: product.id,
              url: videoUrl
            });
            
          if (videoError) {
            console.error('Error adding video:', videoError);
          }
        }
      }

      // Send notification
      try {
        supabase.functions.invoke('send-telegram-notification', {
          body: { productId: product.id }
        }).catch(notifyError => {
          console.error("Error sending notification:", notifyError);
        });
      } catch (notifyError) {
        console.warn("Error sending notification:", notifyError);
      }

      toast({
        title: "Товар создан",
        description: `Товар успешно опубликован на маркетплейсе для продавца ${selectedSeller.full_name}`,
      });

      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар. Попробуйте позже.",
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
            form={form as any}
            onSubmit={createProduct as any}
            isSubmitting={isSubmitting}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            brands={brands}
            brandModels={getModelsForBrand(watchBrandId || "")}
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
            sellers={sellers}
            showSellerSelection={true}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
