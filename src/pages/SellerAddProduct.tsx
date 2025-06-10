
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { useFormAutosave } from "@/hooks/useFormAutosave";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import OptimizedAddProductForm, { createProductSchema, ProductFormValues } from "@/components/product/OptimizedAddProductForm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  
  // Refs for tracking initialization state
  const isInitializedRef = useRef(false);
  const draftLoadedRef = useRef(false);
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

  // Create schema for seller (showSellerSelection = false)
  const sellerProductSchema = useMemo(() => createProductSchema, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(sellerProductSchema),
    defaultValues: {
      title: "",
      price: 0,
      brandId: "",
      modelId: "",
      place_number: 1,
      description: "",
      delivery_price: 0,
    },
    mode: "onChange",
  });

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  // Get form data for autosave - use getValues instead of watch to avoid reactivity
  const getFormDataForAutosave = useCallback(() => form.getValues(), [form]);

  // Автосохранение формы with debounced data
  const { loadSavedData, clearSavedData } = useFormAutosave({
    key: 'seller_add_product',
    data: getFormDataForAutosave(),
    enabled: !isSubmitting && isInitializedRef.current
  });

  // Breadcrumbs навигация
  const breadcrumbItems = useMemo(() => [
    { label: "Панель продавца", href: "/seller/dashboard" },
    { label: "Добавить товар" }
  ], []);

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // Load saved draft on component mount (only once)
  useEffect(() => {
    if (!draftLoadedRef.current && !isSubmitting) {
      console.log("Loading saved draft...");
      const savedData = loadSavedData();
      
      if (savedData && Object.keys(savedData).length > 0) {
        console.log("Found saved draft:", savedData);
        
        // Set form values without triggering watch reactivity
        Object.entries(savedData).forEach(([key, value]) => {
          if (value && key in form.getValues()) {
            form.setValue(key as keyof ProductFormValues, value as any, { shouldValidate: false });
          }
        });
        
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 5000);
      }
      
      draftLoadedRef.current = true;
      isInitializedRef.current = true;
    }
  }, [loadSavedData, form, isSubmitting]);

  // Handle title changes with debounce
  const handleTitleChange = useCallback((title: string) => {
    if (title && brands.length > 0 && !watchBrandId && isInitializedRef.current) {
      console.log("Parsing title for auto-detection:", title);
      const { brandId, modelId } = parseProductTitle(title);
      
      if (brandId) {
        form.setValue("brandId", brandId, { shouldValidate: false });
        
        if (modelId) {
          form.setValue("modelId", modelId, { shouldValidate: false });
        }

        toast({
          title: "Авто обнаружено",
          description: "Марка и модель автомобиля определены из названия",
        });
      }
    }
  }, [brands, parseProductTitle, form, watchBrandId, toast]);

  // Debounced title processing
  useEffect(() => {
    if (!isInitializedRef.current || !watchTitle) return;
    
    const timeoutId = setTimeout(() => {
      handleTitleChange(watchTitle);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchTitle, handleTitleChange]);

  // Handle brand and model changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      // Reset model if it doesn't belong to the selected brand
      if (watchModelId) {
        const modelBelongsToBrand = brandModels.some(model => 
          model.id === watchModelId && model.brand_id === watchBrandId
        );
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "", { shouldValidate: false });
        }
      }
    }

    // Validate model when brandModels change
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "", { shouldValidate: false });
      }
    }
  }, [watchBrandId, watchModelId, selectBrand, form, brandModels]);

  // Unified image upload handler
  const handleImageUpload = useCallback((urls: string[]) => {
    console.log("📷 New images uploaded:", urls);
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  }, [primaryImage]);

  // Unified image deletion handler
  const handleImageDelete = useCallback((url: string) => {
    console.log("🗑️ Deleting image:", url);
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    if (primaryImage === url) {
      if (newImageUrls.length > 0) {
        setPrimaryImage(newImageUrls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  }, [imageUrls, primaryImage]);

  // Enhanced product creation with automatic seller assignment
  const createProduct = async (values: ProductFormValues) => {
    console.log('🚀 createProduct called with values:', values);
    console.log('📊 Current state:', {
      userId: user?.id,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length
    });

    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Пользователь не авторизован",
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

      console.log('🏭 Creating product with seller automatically assigned...', {
        title: values.title,
        sellerId: user.id,
        sellerName: profile?.full_name || '',
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        primaryImage,
        timestamp: new Date().toISOString()
      });
      
      // Create product using standard Supabase insert with automatic seller assignment
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: values.price,
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: user.id, // Automatically assign current user as seller
          seller_name: profile?.full_name || '',
          status: 'pending',
          place_number: values.place_number || 1,
          delivery_price: values.delivery_price || 0,
        })
        .select()
        .single();

      if (productError) {
        console.error("❌ Error creating product:", productError);
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
          console.error('❌ Error adding image:', imageError);
        }
      }

      // Extract public_id from primary image and update product with Cloudinary data
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
            console.error('❌ Error adding video:', videoError);
          }
        }
      }

      // Clear saved draft
      clearSavedData();

      toast({
        title: "Товар создан",
        description: "Товар отправлен на модерацию и будет опубликован после проверки",
      });

      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error("💥 Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup function for memory management
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  return (
    <ErrorBoundary>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                      <Home className="h-4 w-4 mr-1" />
                      Главная
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/seller/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                      Панель продавца
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage className="text-foreground">
                  Добавить товар
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-3xl font-bold mb-6">Добавить товар</h1>
            
            {showDraftSaved && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Загружен сохраненный черновик. Вы можете продолжить заполнение формы.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Информация о товаре
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Cloudinary интеграция
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Заполните все поля и добавьте фотографии для размещения вашего товара на маркетплейсе.
                  Изображения автоматически обрабатываются через Cloudinary для оптимальной производительности.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizedAddProductForm
                  form={form}
                  onSubmit={createProduct}
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
                  handleMobileOptimizedImageUpload={handleImageUpload}
                  setVideoUrls={setVideoUrls}
                  primaryImage={primaryImage}
                  setPrimaryImage={setPrimaryImage}
                  onImageDelete={handleImageDelete}
                  showSellerSelection={false} // Hide seller selection for normal sellers
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default SellerAddProduct;
