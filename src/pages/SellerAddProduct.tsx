import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import OptimizedAddProductForm, { productSchema, ProductFormValues } from "@/components/product/OptimizedAddProductForm";
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
  
  // Use our custom hook for car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData 
  } = useCarBrandsAndModels();

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

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  );

  // Автосохранение формы
  const formData = form.watch();
  const { loadSavedData, clearSavedData } = useFormAutosave({
    key: 'seller_add_product',
    data: formData,
    enabled: !isSubmitting
  });

  // Breadcrumbs навигация
  const breadcrumbItems = useMemo(() => [
    { label: "Профиль продавца", href: "/seller/profile" },
    { label: "Добавить товар" }
  ], []);

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  // Загрузка сохраненного черновика при инициализации
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData && Object.keys(savedData).length > 0) {
      // Проверяем, что форма пуста перед загрузкой черновика
      const currentFormIsEmpty = !formData.title && !formData.price && !formData.brandId;
      
      if (currentFormIsEmpty) {
        Object.entries(savedData).forEach(([key, value]) => {
          if (value && key in formData) {
            form.setValue(key as keyof ProductFormValues, value as any);
          }
        });
        
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 5000);
      }
    }
  }, [loadSavedData, form, formData]);

  // Мемоизированная функция для обработки изменений названия
  const handleTitleChange = useCallback((title: string) => {
    if (title && brands.length > 0 && !watchBrandId) {
      const { brandId, modelId } = parseProductTitle(title);
      
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
  }, [brands, brandModels, parseProductTitle, form, watchBrandId, toast]);

  // Объединенный и оптимизированный useEffect для обработки изменений
  useEffect(() => {
    // Обработка изменений названия с debounce
    if (watchTitle) {
      const timeoutId = setTimeout(() => {
        handleTitleChange(watchTitle);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [watchTitle, handleTitleChange]);

  // Отдельный useEffect для обработки изменений бренда и модели
  useEffect(() => {
    if (watchBrandId) {
      selectBrand(watchBrandId);
      
      // Reset model if it doesn't belong to the selected brand
      if (watchModelId) {
        const modelBelongsToBrand = brandModels.some(model => 
          model.id === watchModelId && model.brand_id === watchBrandId
        );
        if (!modelBelongsToBrand) {
          form.setValue("modelId", "");
        }
      }
    }

    // Validate model when brandModels change
    if (watchModelId && brandModels.length > 0) {
      const modelExists = brandModels.some(model => model.id === watchModelId);
      if (!modelExists) {
        form.setValue("modelId", "");
      }
    }
  }, [watchBrandId, watchModelId, selectBrand, form, brandModels]);

  const handleMobileOptimizedImageUpload = useCallback((urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    } else if (primaryImage && !urls.includes(primaryImage)) {
      if (urls.length > 0) {
        setPrimaryImage(urls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  }, [primaryImage]);

  const removeImage = useCallback((url: string) => {
    setImageUrls(prevUrls => {
      const newUrls = prevUrls.filter(item => item !== url);
      
      // If deleted image was primary, set new primary
      if (primaryImage === url) {
        if (newUrls.length > 0) {
          setPrimaryImage(newUrls[0]);
        } else {
          setPrimaryImage("");
        }
      }
      
      return newUrls;
    });
  }, [primaryImage]);

  // Enhanced product creation with Cloudinary data
  const createProduct = async (values: ProductFormValues) => {
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

      console.log('🏭 Creating product with images...', {
        title: values.title,
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        primaryImage,
        timestamp: new Date().toISOString()
      });
      
      // Create product using standard Supabase insert
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: parseFloat(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: user?.id,
          seller_name: profile?.full_name || '',
          status: 'pending',
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
            console.error('Error adding video:', videoError);
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
                    <Link to="/seller/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                      Профиль продавца
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
                  handleMobileOptimizedImageUpload={(urls: string[]) => {
                    console.log('📷 New images uploaded:', urls);
                    setImageUrls(prevUrls => [...prevUrls, ...urls]);
                    if (!primaryImage && urls.length > 0) {
                      setPrimaryImage(urls[0]);
                    }
                  }}
                  setVideoUrls={setVideoUrls}
                  primaryImage={primaryImage}
                  setPrimaryImage={setPrimaryImage}
                  onImageDelete={(url: string) => {
                    const newImageUrls = imageUrls.filter(item => item !== url);
                    setImageUrls(newImageUrls);
                    if (primaryImage === url) {
                      if (newImageUrls.length > 0) {
                        setPrimaryImage(newImageUrls[0]);
                      } else {
                        setPrimaryImage("");
                      }
                    }
                  }}
                  showSellerSelection={false}
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
