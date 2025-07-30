import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { devLog, criticalError, optimizeImageLoad } from "@/utils/productionOptimizer";
import { performanceTracker } from "@/utils/performanceTracker";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductSEO from "@/components/seo/ProductSEO";
import ProductSkeleton from "@/components/product/ProductSkeleton";
import ProductLoadingState from "@/components/loading/ProductLoadingState";
import ProductDetailHeader from "@/components/product/ProductDetailHeader";
import ProductDetailAlerts from "@/components/product/ProductDetailAlerts";
import SellerProductContent from "@/components/seller/SellerProductContent";
import SellerProductActions from "@/components/seller/SellerProductActions";
import SellerOffersSummary from "@/components/seller/SellerOffersSummary";
import MobileSellerProductLayout from "@/components/seller/mobile/MobileSellerProductLayout";
import { Product } from "@/types/product";
import SellerLayout from "@/components/layout/SellerLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductErrorBoundary from "@/components/error/ProductErrorBoundary";
import { MobileStabilizer } from "@/components/MobileStabilizer";

const SellerProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Initialize inline edit hooks at the top level to avoid conditional hook usage
  const {
    updateTitle,
    updatePrice,
    updateDescription,
    updatePlaceNumber,
    updateDeliveryPrice,
    updateLocation,
  } = useInlineEdit({
    productId: id || '',
    onUpdate: () => {
      // Product update handled by React Query cache invalidation
    }
  });
  
  // Security check: ensure user is a seller
  useEffect(() => {
    if (profile && profile.user_type !== 'seller') {
      toast({
        title: "Доступ запрещен",
        description: "Эта страница доступна только продавцам.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [profile, navigate]);

  // Product query with seller ownership validation
  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: () => performanceTracker.measureAsync('seller-product-fetch', async () => {
      if (!id) {
        throw new Error('No product ID provided');
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images(*),
            product_videos(*)
          `)
          .eq('id', id)
          .eq('seller_id', user.id) // Ensure seller can only view their own products
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Product not found or access denied');
        }
        
        return data as Product;
      } catch (error) {
        criticalError(error as Error, { 
          context: 'SellerProductDetail fetch', 
          productId: id, 
          userId: user.id 
        });
        throw error;
      }
    }),
    enabled: !!id && !!user && profile?.user_type === 'seller',
    retry: false, // Don't retry for security errors
  });
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/seller/listings');
  };
  
  // Handle product updates
  const handleProductUpdate = () => {
    // Product update handled by React Query cache invalidation
  };
  
  // Loading state
  if (isLoading && !product) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <ProductLoadingState message="Loading your product details..." />
        </div>
      </SellerLayout>
    );
  }
  
  // Error state or access denied
  if (isError || !product) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Alert variant="destructive" className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertTitle>Доступ запрещен</AlertTitle>
            <AlertDescription>
              Вы можете просматривать только свои собственные объявления. 
              Проверьте правильность ссылки или вернитесь к списку ваших объявлений.
            </AlertDescription>
          </Alert>
          <Button variant="default" onClick={handleBack}>
            Вернуться к моим объявлениям
          </Button>
        </div>
      </SellerLayout>
    );
  }
  
  // Set the first image as selected if none is selected - moved to useMemo to avoid setState in render
  const initialSelectedImage = useMemo(() => {
    if (product.product_images?.length && !selectedImage) {
      const primaryImage = product.product_images.find(img => img.is_primary)?.url 
        || product.product_images[0]?.url;
      return primaryImage || null;
    }
    return selectedImage;
  }, [product.product_images, selectedImage]);

  // Update selected image only when needed
  useEffect(() => {
    if (initialSelectedImage && initialSelectedImage !== selectedImage) {
      setSelectedImage(initialSelectedImage);
    }
  }, [initialSelectedImage, selectedImage]);
  
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };
  
  // Extract and optimize URLs for components
  const imageUrls = useMemo(() => 
    product.product_images 
      ? product.product_images.map(img => optimizeImageLoad(img.url)) 
      : [],
    [product.product_images]
  );
  
  const videoUrls = useMemo(() => 
    product.product_videos 
      ? product.product_videos.map(video => video.url) 
      : [],
    [product.product_videos]
  );
  
  const sellerName = product.seller_name || (profile?.full_name || "Неизвестный продавец");

  // Unified layout - using MobileStabilizer to prevent hook order issues
  return (
    <ProductErrorBoundary>
      <MobileStabilizer>
        {(stabilizedIsMobile) => (
          <SellerLayout className={stabilizedIsMobile ? "p-0" : ""}>
            {/* SEO Component */}
            <ProductSEO 
              product={product}
              sellerName={sellerName}
              images={imageUrls}
            />
            
            {/* Mobile Layout */}
            <div className={stabilizedIsMobile ? "block" : "hidden"}>
              <MobileSellerProductLayout
                key={`mobile-${product.id}`}
                product={product}
                imageUrls={imageUrls || []}
                videoUrls={videoUrls || []}
                selectedImage={selectedImage || (imageUrls && imageUrls[0]) || null}
                onImageClick={handleImageClick}
                onProductUpdate={handleProductUpdate}
                updateTitle={updateTitle}
                updatePrice={updatePrice}
                updateDescription={updateDescription}
                updatePlaceNumber={updatePlaceNumber}
                updateDeliveryPrice={updateDeliveryPrice}
                updateLocation={updateLocation}
              />
            </div>
            
            {/* Desktop Layout */}
            <div className={stabilizedIsMobile ? "hidden" : "block"}>
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Breadcrumb Navigation */}
                <ProductBreadcrumb
                  productTitle={product.title}
                  brand={product.brand}
                  model={product.model}
                  isSeller={true}
                />
                
                {/* Header */}
                <ProductDetailHeader 
                  product={product}
                  onBack={handleBack}
                />
                
                {/* Status warnings */}
                <ProductDetailAlerts 
                  product={product}
                  isOwner={true}
                  isAdmin={false}
                />
                
                {/* Seller Action Buttons */}
                <SellerProductActions 
                  product={product}
                  onProductUpdate={handleProductUpdate}
                />
                
                {/* Offers Summary */}
                <SellerOffersSummary 
                  productId={product.id}
                />
                
                {/* Main content */}
                <SellerProductContent 
                  product={product}
                  imageUrls={imageUrls}
                  videoUrls={videoUrls}
                  selectedImage={selectedImage}
                  onImageClick={handleImageClick}
                />
              </div>
            </div>
          </SellerLayout>
        )}
      </MobileStabilizer>
    </ProductErrorBoundary>
  );
};

export default SellerProductDetail;