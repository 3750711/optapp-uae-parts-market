import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { useMobileLayout } from "@/hooks/useMobileLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductSEO from "@/components/seo/ProductSEO";
import ProductSkeleton from "@/components/product/ProductSkeleton";
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
import ProductErrorBoundary from "@/components/error/ProductErrorBoundary";
// i18n: язык и словари
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { getCommonTranslations } from '@/utils/translations/common';

const SellerProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isMobile } = useMobileLayout();
  
  // i18n
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  
  // Security check: ensure user is a seller
  useEffect(() => {
    if (profile && profile.user_type !== 'seller') {
          toast({
            title: sp.accessDenied,
            description: sp.onlyForSellers,
            variant: "destructive"
          });
      navigate('/');
    }
  }, [profile, navigate]);

  // Product query with seller ownership validation
  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('No product ID provided');
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      try {
        const { data, error } = await supabase
          .from('products_with_view_estimate')
          .select(`
            *,
            product_images(*),
            product_videos(*)
          `)
          .eq('id', id)
          .eq('seller_id', user.id)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Product not found or access denied');
        }
        
        return data as Product;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!id && !!user && profile?.user_type === 'seller',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/seller/listings');
  };
  
  
  // Loading state
  if (isLoading && !product) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <ProductSkeleton />
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
            <AlertTitle>{sp.accessDenied}</AlertTitle>
            <AlertDescription>
              {sp.accessDeniedDescription}
            </AlertDescription>
          </Alert>
          <Button variant="default" onClick={handleBack}>
            {c.buttons.backToOrders}
          </Button>
        </div>
      </SellerLayout>
    );
  }
  
  // Set the first image as selected if none is selected (following ProductDetail pattern)
  if (product && product.product_images?.length && !selectedImage) {
    const primaryImage = product.product_images.find(img => img.is_primary)?.url 
      || product.product_images[0]?.url;
      
    if (primaryImage) {
      setSelectedImage(primaryImage);
    }
  }
  
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };
  
  // Extract URLs for components
  const imageUrls = product?.product_images 
    ? product.product_images.map(img => img.url) 
    : [];
  
  const videoUrls = product?.product_videos 
    ? product.product_videos.map(video => video.url) 
    : [];
  
  const sellerName = product?.seller_name || (profile?.full_name || sp.unknownSeller);

  if (!product) return null;

  // Mobile Layout (following ProductDetail pattern)
  if (isMobile) {
    return (
      <ProductErrorBoundary>
        <SellerLayout className="p-0">
          <ProductSEO 
            product={product}
            sellerName={sellerName}
            images={imageUrls}
          />
          
          <MobileSellerProductLayout
            product={product}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            selectedImage={selectedImage}
            onImageClick={handleImageClick}
          />
        </SellerLayout>
      </ProductErrorBoundary>
    );
  }

  // Desktop Layout
  return (
    <ProductErrorBoundary>
      <SellerLayout>
        {/* SEO Component */}
        <ProductSEO 
          product={product}
          sellerName={sellerName}
          images={imageUrls}
        />
        
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
      </SellerLayout>
    </ProductErrorBoundary>
  );
};

export default SellerProductDetail;