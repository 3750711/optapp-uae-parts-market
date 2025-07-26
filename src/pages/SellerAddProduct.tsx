import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";
import { useProductTitleParser } from "@/utils/productTitleParser";
import { useFormAutosave } from "@/hooks/useFormAutosave";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import AddProductForm, { productSchema, ProductFormValues } from "@/components/product/AddProductForm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Use the new hook that loads all car brands and models
  const { 
    brands, 
    brandModels, 
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    allModels, // Needed for title parser
  } = useAllCarBrands();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      brandId: "",
      modelId: "",
      placeNumber: "1",
      description: "",
      deliveryPrice: "",
    },
    mode: "onChange",
  });

  // Initialize our title parser
  const { parseProductTitle } = useProductTitleParser(
    brands,
    allModels, // Pass allModels here
    findBrandIdByName,
    findModelIdByName
  );

  // Get form data for autosave - use getValues instead of watch to avoid reactivity
  const getFormDataForAutosave = useCallback(() => form.getValues(), [form]);

  // Автосохранение формы with debounced data
  const { loadSavedData, clearSavedData } = useFormAutosave({
    key: 'seller_add_product',
    data: getFormDataForAutosave(),
    enabled: !isSubmitting
  });

  // Breadcrumbs navigation
  const breadcrumbItems = useMemo(() => [
    { label: "Seller Dashboard", href: "/seller/dashboard" },
    { label: "Add Product" }
  ], []);

  const watchBrandId = form.watch("brandId");
  const watchModelId = form.watch("modelId");
  const watchTitle = form.watch("title");

  useEffect(() => {
    if (!draftLoaded && !isSubmitting) {
      const savedData = loadSavedData();
      if (savedData && Object.keys(savedData).length > 0) {
        Object.entries(savedData).forEach(([key, value]) => {
          if (value && key in form.getValues()) {
            form.setValue(key as keyof ProductFormValues, value as any, { shouldValidate: false });
          }
        });
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 5000);
      }
      setDraftLoaded(true);
    }
  }, [loadSavedData, form, isSubmitting, draftLoaded]);

  // Handle title changes with debounce - only if car data should load
  const handleTitleChange = useCallback((title: string) => {
    if (title && brands.length > 0 && !watchBrandId) {
      console.log("Parsing title for auto-detection:", title);
      const { brandId, modelId } = parseProductTitle(title);
      
      if (brandId) {
        form.setValue("brandId", brandId, { shouldValidate: false });
        
        if (modelId) {
          form.setValue("modelId", modelId, { shouldValidate: false });
        }

        toast({
          title: "Car Detected",
          description: "Car brand and model determined from title",
        });
      }
    }
  }, [brands, parseProductTitle, form, watchBrandId, toast]);

  // Debounced title processing
  useEffect(() => {
    if (!watchTitle) return;
    
    const timeoutId = setTimeout(() => {
      handleTitleChange(watchTitle);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchTitle, handleTitleChange]);

  // Handle brand and model changes - only if car data should load
  useEffect(() => {
    
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
        title: "Error",
        description: "Add at least one photo",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authorized",
        variant: "destructive",
      });
      return;
    }
    
    if (!profile?.opt_id) {
      toast({
        title: "Profile Incomplete",
        description: "Your profile is missing an OPT ID. Please contact the administrator to obtain one.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get brand and model names for the database (only if car data loaded)
      let brandName = null;
      let modelName = null;
      
      if (values.brandId) {
        const selectedBrand = brands.find(brand => brand.id === values.brandId);
        brandName = selectedBrand?.name || null;
        
        if (values.modelId) {
          const selectedModel = brandModels.find(model => model.id === values.modelId);
          modelName = selectedModel?.name || null;
        }
      }

      console.log('🏭 Creating product with seller automatically assigned...', {
        title: values.title,
        sellerId: user.id,
        sellerName: profile?.full_name || '',
        imageCount: imageUrls.length,
        videoCount: videoUrls.length,
        primaryImage,
        brandName,
        modelName,
        timestamp: new Date().toISOString()
      });
      
      // Determine product status based on seller trust level (like admin approach)
      const productStatus = profile?.is_trusted_seller ? 'active' : 'pending';
      
      console.log('👤 Seller trust status:', {
        isTrustedSeller: profile?.is_trusted_seller,
        productStatus,
        sellerId: user.id
      });

      // Create product using standard Supabase insert with automatic seller assignment
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: Number(values.price),
          condition: "Новый",
          brand: brandName,
          model: modelName,
          description: values.description || null,
          seller_id: user.id, // Automatically assign current user as seller
          seller_name: profile?.full_name || '',
          status: productStatus, // Use determined status based on trust level
          place_number: Number(values.placeNumber) || 1,
          delivery_price: Number(values.deliveryPrice) || 0,
        })
        .select()
        .single();

      if (productError) {
        console.error("❌ Error creating product:", productError);
        throw productError;
      }

      console.log('✅ Product created:', product.id);

      // Add images using mass insert (like admin)
      const imageInserts = imageUrls.map(url => ({
        product_id: product.id,
        url: url,
        is_primary: url === primaryImage
      }));
      
      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);
        
      if (imageError) {
        console.error('❌ Error adding images:', imageError);
        // Rollback: delete the product if image upload fails
        await supabase.from('products').delete().eq('id', product.id);
        throw new Error(`Error adding images: ${imageError.message}`);
      }
      
      console.log(`✅ ${imageUrls.length} images inserted for product ${product.id}`);

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

      // Add videos using mass insert (like admin)
      if (videoUrls.length > 0) {
        const videoInserts = videoUrls.map(videoUrl => ({
          product_id: product.id,
          url: videoUrl
        }));
        
        const { error: videoError } = await supabase
          .from('product_videos')
          .insert(videoInserts);
          
        if (videoError) {
          console.error('❌ Error adding videos:', videoError);
          // Non-critical error - don't rollback for videos
        } else {
          console.log(`✅ ${videoUrls.length} videos inserted for product ${product.id}`);
        }
      }

      // For trusted sellers, send notification like admin (after images are added)
      if (profile?.is_trusted_seller) {
        try {
          console.log('📢 Sending notification for trusted seller product:', product.id);
          await supabase.functions.invoke('send-telegram-notification', {
            body: { productId: product.id }
          });
          console.log('✅ Notification sent successfully for trusted seller');
        } catch (notificationError) {
          console.error('⚠️ Notification failed (non-critical):', notificationError);
        }
      }

      // Clear saved draft
      clearSavedData();

      const successMessage = profile?.is_trusted_seller 
        ? "Product successfully published"
        : "Product sent for moderation and will be published after review";

      toast({
        title: "Product Created",
        description: successMessage,
      });

      navigate(`/product/${product.id}`);
    } catch (error) {
      console.error("💥 Error creating product:", error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again later.",
        variant: "destructive",
      });
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

  // Fallback UI для загрузки данных по брендам:
  if (isLoadingCarData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Loading car data...</span>
      </div>
    );
  }

  // Error Boundary (UI-level)
  try {
    return (
      <GlobalErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/seller/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/seller/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                      Seller Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage className="text-foreground">
                  Add Product
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            
            <h1 className="text-3xl font-bold mb-6">Add Product</h1>
            
            {showDraftSaved && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Saved draft loaded. You can continue filling out the form.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Product Information
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Cloudinary integration
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Fill in all fields to create a product. The product will be sent for moderation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddProductForm
                  form={form}
                  onSubmit={(values) => guardedSubmit(() => createProduct(values))}
                  isSubmitting={isSubmitting}
                  imageUrls={imageUrls}
                  videoUrls={videoUrls}
                  brands={brands}
                  brandModels={brandModels}
                  isLoadingCarData={isLoadingCarData}
                  watchBrandId={form.watch("brandId")}
                  handleMobileOptimizedImageUpload={handleImageUpload}
                  setVideoUrls={setVideoUrls}
                  primaryImage={primaryImage}
                  setPrimaryImage={setPrimaryImage}
                  showSellerSelection={false}
                  onImageDelete={handleImageDelete}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </GlobalErrorBoundary>
    );
  } catch (e: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg mb-2">Произошла ошибка при загрузке страницы</div>
        <div className="text-gray-500">{e?.message}</div>
      </div>
    );
  }
};

export default SellerAddProduct;
