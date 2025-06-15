import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useProductTitleParser } from "@/utils/productTitleParser";
import AddProductForm, { ProductFormValues, productSchema } from "@/components/product/AddProductForm";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";

// Admin product schema with required sellerId
const adminProductSchema = productSchema.extend({
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
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [sellers, setSellers] = useState<{ id: string; full_name: string; opt_id: string }[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  
  // Возвращаем хук useAllCarBrands
  const { 
    brands, 
    brandModels, 
    allModels,
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    validateModelBrand
  } = useAllCarBrands();

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    allModels, // Используем все модели для корректного парсинга
    findBrandIdByName,
    () => null // Временная заглушка, т.к. парсер не использует эту функцию
  );

  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "",
      sellerId: "",
    },
    mode: "onChange",
  });

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // When title changes, try to detect brand and model
  useEffect(() => {
    if (watchTitle && brands.length > 0 && allModels.length > 0 && !watchBrandId) {
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
  }, [watchTitle, brands, allModels, parseProductTitle, form, watchBrandId, toast]);

  // Fetch sellers with OPT ID
  useEffect(() => {
    const fetchSellers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .not('opt_id', 'is', null) // Ensure opt_id is not null
        .neq('opt_id', '')         // Ensure opt_id is not an empty string
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

  // Filter brands and models based on search terms
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  const filteredModels = brandModels.filter(model =>
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

  // Enhanced product creation with Cloudinary data
  const createProduct = async (values: AdminProductFormValues) => {
    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get brand and model names for the database
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      
      // Get selected seller
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
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
      
      // Create product using standard Supabase insert
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: Number(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: values.sellerId,
          seller_name: selectedSeller.full_name,
          status: 'active',
          place_number: Number(values.placeNumber) || 1,
          delivery_price: Number(values.deliveryPrice) || 0,
        })
        .select()
        .single();

      if (productError) {
        console.error("Error creating product:", productError);
        throw productError;
      }

      console.log('✅ Product created:', product.id);

      // Add images with improved error handling
      const imageInsertErrors: { url: string; error: any }[] = [];
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
          imageInsertErrors.push({ url, error: imageError });
        }
      }

      if (imageInsertErrors.length > 0) {
        toast({
            title: "Ошибка при сохранении изображений",
            description: `Не удалось сохранить ${imageInsertErrors.length} из ${imageUrls.length} изображений. Вы можете добавить их позже через редактирование товара.`,
            variant: "destructive",
        });
      }

      // Extract public_id from primary image and update product with Cloudinary data
      if (primaryImage) {
        try {
          console.log('🎨 Extracting public_id from primary image:', primaryImage);
          const publicId = extractPublicIdFromUrl(primaryImage);
          
          if (publicId) {
            console.log('📸 Updating product with Cloudinary data:', {
              productId: product.id,
              publicId,
              cloudinaryUrl: primaryImage
            });

            // Update product with Cloudinary data
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
            console.warn('⚠️ Could not extract public_id from primary image URL:', primaryImage);
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
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <AddProductForm
            form={form as any}
            onSubmit={(values) => guardedSubmit(() => createProduct(values))}
            isSubmitting={isSubmitting}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            brands={brands}
            brandModels={brandModels}
            isLoadingCarData={isLoadingCarData}
            watchBrandId={form.watch("brandId")}
            searchBrandTerm={searchBrandTerm}
            setSearchBrandTerm={setSearchBrandTerm}
            searchModelTerm={searchModelTerm}
            setSearchModelTerm={setSearchModelTerm}
            filteredBrands={filteredBrands}
            filteredModels={filteredModels}
            handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
            setVideoUrls={setVideoUrls}
            primaryImage={primaryImage}
            setPrimaryImage={setPrimaryImage}
            sellers={sellers}
            showSellerSelection={true}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
