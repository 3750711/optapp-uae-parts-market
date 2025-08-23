import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
import { getCommonTranslations } from "@/utils/translations/common";

import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLazyCarBrands } from "@/hooks/useLazyCarBrands";
import { createProductTitleParser } from "@/utils/productTitleParser";
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
import { Home, ArrowLeft, Loader2 } from "lucide-react";
import { productSchema, ProductFormValues } from "@/components/product/AddProductForm";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { initMobileFormOptimizations, trackMobileFormMetrics } from "@/utils/mobileFormOptimizations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

// Lazy load the mobile-optimized form
const MobileFastAddProduct = React.lazy(() => import("@/components/product/MobileFastAddProduct"));
const AddProductForm = React.lazy(() => import("@/components/product/AddProductForm"));

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { guardedSubmit, isSubmitting } = useSubmissionGuard();
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const isMobile = useIsMobile();
  const { notifyAdminsNewProduct } = useAdminNotifications();

  // Use lazy car brands hook for better performance
  const { 
    brands, 
    brandModels, 
    allModels,
    selectBrand,
    findBrandIdByName,
    findModelIdByName, 
    isLoading: isLoadingCarData,
    enableBrandsLoading,
    enableAllModelsLoading,
    shouldLoadBrands,
    shouldLoadAllModels
  } = useLazyCarBrands();

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
    mode: "onBlur", // Changed from onChange for better mobile performance
  });

  // Initialize mobile optimizations
  useEffect(() => {
    initMobileFormOptimizations();
    trackMobileFormMetrics.formStart();
    
    return () => {
      trackMobileFormMetrics.formComplete();
    };
  }, []);

  // Load car brands when component mounts (lazy loading)
  useEffect(() => {
    enableBrandsLoading();
  }, [enableBrandsLoading]);

  // Initialize our title parser (only when needed)
  const parseProductTitle = useMemo(() => {
    if (brands.length > 0 && allModels.length > 0) {
      return createProductTitleParser(brands, allModels);
    }
    return () => ({ brandId: null, modelId: null });
  }, [brands, allModels]);

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
    { label: sp.system?.sellerDashboardBreadcrumb || "Seller Dashboard", href: "/seller/dashboard" },
    { label: sp.system?.addProductBreadcrumb || "Add Product" }
  ], [sp.system]);

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

  // Handle title changes with debounce - optimized for mobile
  const handleTitleChange = useCallback((title: string) => {
    if (title && brands.length > 0 && !watchBrandId) {
      // Enable all models loading if not already enabled
      if (!shouldLoadAllModels) {
        enableAllModelsLoading();
      }
      
      console.log("Parsing title for auto-detection:", title);
      const { brandId, modelId } = parseProductTitle(title);
      
      if (brandId) {
        form.setValue("brandId", brandId, { shouldValidate: false });
        
        if (modelId) {
          form.setValue("modelId", modelId, { shouldValidate: false });
        }

        toast({
          title: t.messages.carDetected,
          description: t.messages.carDetectedDescription,
        });
      }
    }
  }, [brands, parseProductTitle, form, watchBrandId, toast, shouldLoadAllModels, enableAllModelsLoading]);

  // Debounced title processing - increased delay for mobile
  useEffect(() => {
    if (!watchTitle) return;
    
    const delay = isMobile ? 1000 : 500; // Longer delay on mobile
    const timeoutId = setTimeout(() => {
      handleTitleChange(watchTitle);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [watchTitle, handleTitleChange, isMobile]);

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
        title: t.messages.imageRequired,
        description: t.messages.imageRequired,
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: sp.system?.error || "Error",
        description: sp.system?.userNotAuthorized || "User not authorized",
        variant: "destructive",
      });
      return;
    }
    
    if (!profile?.opt_id) {
      toast({
        title: sp.system?.profileIncomplete || "Profile Incomplete",
        description: sp.system?.profileIncompleteDescription || "Your profile is missing an OPT ID. Please contact the administrator to obtain one.",
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

      // Send notifications based on product status
      if (profile?.is_trusted_seller) {
        // For trusted sellers, send regular notification
        try {
          console.log('📢 Sending notification for trusted seller product:', product.id);
          await supabase.functions.invoke('send-telegram-notification', {
            body: { productId: product.id }
          });
          console.log('✅ Notification sent successfully for trusted seller');
        } catch (notificationError) {
          console.error('⚠️ Notification failed (non-critical):', notificationError);
        }
      } else {
        // For regular sellers, notify admins about pending product
        try {
          console.log('📢 Notifying admins about new pending product:', product.id);
          await notifyAdminsNewProduct(product.id);
          console.log('✅ Admin notification sent successfully');
        } catch (notificationError) {
          console.error('⚠️ Admin notification failed (non-critical):', notificationError);
        }
      }

      // Clear saved draft
      clearSavedData();

      const successMessage = profile?.is_trusted_seller 
        ? sp.system?.productPublished || "Product successfully published"
        : sp.system?.productSentForModeration || "Product sent for moderation and will be published after review";

      toast({
        title: t.messages.productCreated,
        description: successMessage,
      });

      navigate(`/seller/product/${product.id}`);
    } catch (error) {
      console.error("💥 Error creating product:", error);
      toast({
        title: sp.system?.error || "Error",
        description: sp.system?.failedToCreateProduct || "Failed to create product. Please try again later.",
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

  // Loading state with minimal UI
  const LoadingState = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{t.messages.loadingCarData}</span>
      </div>
    </div>
  );

  // Memoized back handler
  const handleBack = useCallback(() => {
    navigate('/seller/dashboard');
  }, [navigate]);

  // Handle media upload state changes
  const handleUploadStateChange = useCallback((uploading: boolean) => {
    setIsMediaUploading(uploading);
  }, []);

  // Memoized form submission
  const handleFormSubmit = useCallback((values: ProductFormValues) => {
    guardedSubmit(() => createProduct(values));
  }, [guardedSubmit, createProduct]);

  // Check if we should show loading state
  const isInitialLoading = shouldLoadBrands && isLoadingCarData && brands.length === 0;

  // Error Boundary (UI-level)
  try {
    // Show loading state if initial car data is being loaded
    if (isInitialLoading) {
      return <LoadingState />;
    }

    return (
      <GlobalErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          {!isMobile && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.buttons.backToDashboard}
                </Button>
              </div>
              
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/seller/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        {sp.sellerDashboard}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbPage className="text-foreground">
                    {t.sections.addProduct}
                  </BreadcrumbPage>
                </BreadcrumbList>
              </Breadcrumb>
              
              <h1 className="text-3xl font-bold mb-6">{t.sections.addProduct}</h1>
              
              {showDraftSaved && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t.messages.draftLoadedDescription}
                  </AlertDescription>
                </Alert>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {t.sections.productInformation}
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {sp.system?.cloudinaryIntegration || 'Cloudinary integration'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {t.sections.productDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<LoadingState />}>
                    <AddProductForm
                      form={form}
                      onSubmit={handleFormSubmit}
                      isSubmitting={isSubmitting || isMediaUploading}
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
                      onImageDelete={handleImageDelete}
                      onUploadStateChange={handleUploadStateChange}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile-optimized form */}
          {isMobile && (
            <Suspense fallback={<LoadingState />}>
              <MobileFastAddProduct
                form={form}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting || isMediaUploading}
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
                onImageDelete={handleImageDelete}
                onBack={handleBack}
                onUploadStateChange={handleUploadStateChange}
              />
            </Suspense>
          )}

          {/* Mobile draft notification */}
          {isMobile && showDraftSaved && (
              <div className="fixed top-4 left-4 right-4 z-50">
                <Alert className="bg-background/95 backdrop-blur-sm border shadow-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t.messages.draftLoadedMobile}
                  </AlertDescription>
                </Alert>
              </div>
          )}
        </div>
      </GlobalErrorBoundary>
    );
  } catch (error) {
    console.error('💥 Critical error in SellerAddProduct page:', error);
    
    // Fallback UI for critical errors
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {sp.system?.pageError || 'Page Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {sp.system?.pageErrorDescription || 'A critical error occurred while loading this page. Please try refreshing the page or contact support.'}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              {t.buttons.refreshPage}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default SellerAddProduct;
