
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductSEO from "@/components/seo/ProductSEO";
import ProductSkeleton from "@/components/product/ProductSkeleton";
import ProductDetailHeader from "@/components/product/ProductDetailHeader";
import ProductDetailAlerts from "@/components/product/ProductDetailAlerts";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import { useOptimizedProductImages } from "@/hooks/useOptimizedProductImages";
import SellerProducts from "@/components/product/SimilarProducts";
import MobileProductLayout from "@/components/product/mobile/MobileProductLayout";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database } from "@/integrations/supabase/types";
import { AuthPromptOverlay } from "@/components/product/AuthPromptOverlay";
import { useLanguage } from "@/hooks/useLanguage";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { isMobile } = useMobileLayout();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const fromSeller = searchParams.get("from") === "seller";
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<Database["public"]["Enums"]["delivery_method"]>("cargo_rf");
  
  const handleDeliveryMethodChange = (method: Database["public"]["Enums"]["delivery_method"]) => {
    setDeliveryMethod(method);
  };
  
  // Fixed back button functionality
  const handleBack = () => {
    try {
      if (fromSeller) {
        navigate('/seller/listings');
      } else if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Ошибка навигации",
        description: "Не удалось вернуться назад. Перенаправляем на главную страницу.",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  // Product query - use products_public for unauthenticated users
  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['product', id, user?.id],
    queryFn: async () => {
      if (!id) {
        throw new Error('No product ID provided');
      }
      
      try {
        // Use products_public for unauthenticated users, products for authenticated
        const tableName = user ? 'products' : 'products_public';
        
        const { data, error } = await supabase
          .from(tableName)
          .select(`
            *,
            product_images(*),
            product_videos(*)
          `)
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Product not found');
        }
        
        const isCreator = user?.id === data.seller_id;
        
        if (data.status === 'pending' && !isCreator && !isAdmin) {
          throw new Error('Access denied: Product is pending approval');
        }
        
        if (data.status === 'archived' && !isCreator && !isAdmin) {
          throw new Error('Access denied: Product is archived');
        }
        
        return data as Product;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!id && !authLoading,
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          (error.message.includes('Access denied') || 
           error.message.includes('Product not found'))) {
        return false;
      }
      return failureCount < 1;
    },
  });
  
  // Track product view
  useEffect(() => {
    const trackView = async () => {
      if (product?.id && user) {
        try {
          // Only track views for authenticated users to avoid spam
          await supabase.rpc('increment_product_view_count', { 
            product_id: product.id 
          });
        } catch (error) {
          // Silently fail view tracking
        }
      }
    };
    
    trackView();
  }, [product?.id, user]);
  
  // Navigate to 404 on error
  useEffect(() => {
    if (isError && !isLoading && !authLoading) {
      const timer = setTimeout(() => {
        navigate('/404');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isError, isLoading, authLoading, navigate]);
  
  // Seller profile query
  const { data: sellerProfile, isLoading: sellerLoading } = useQuery({
    queryKey: ['sellerProfile', product?.seller_id],
    queryFn: async () => {
      if (!product?.seller_id) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', product.seller_id)
          .maybeSingle();
          
          if (error) {
            return null;
          }
        
        return data;
      } catch (err) {
        return null;
      }
    },
    enabled: !!product?.seller_id,
    retry: 1,
  });
  
  // Call useOptimizedProductImages before any conditional returns (React hooks rules)
  const optimizedImages = useOptimizedProductImages(product || null, { generateVariants: true, maxImages: 1 });
  const productPrimaryImage = optimizedImages[0]?.card || '/placeholder.svg';
  
  const handleProductUpdate = () => {
    // Product update handled by React Query cache invalidation
  };
  
  // Loading state
  if (authLoading || (isLoading && !product) || sellerLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <ProductSkeleton />
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Ошибка загрузки объявления</AlertTitle>
            <AlertDescription>
              Не удалось загрузить информацию об объявлении. Пожалуйста, попробуйте позже или вернитесь на главную страницу.
            </AlertDescription>
          </Alert>
          <Button variant="default" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </div>
      </Layout>
    );
  }
  
  if (!product) return null;
  
  // Set the first image as selected if none is selected
  if (!selectedImage && productPrimaryImage) {
    setSelectedImage(productPrimaryImage);
  }
  
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };
  
  // Extract URLs for components
  const imageUrls = product.product_images 
    ? product.product_images.map(img => img.url) 
    : [];
  
  const videoUrls = product.product_videos 
    ? product.product_videos.map(video => video.url) 
    : [];
  
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");
  const isOwner = user?.id === product.seller_id;
  
  // Mobile Layout
  if (isMobile) {
    return (
      <Layout>
        <ProductSEO 
          product={product}
          sellerName={sellerName}
          images={imageUrls}
        />
        
        <MobileProductLayout
          product={product}
          imageUrls={imageUrls}
          videoUrls={videoUrls}
          selectedImage={selectedImage}
          onImageClick={handleImageClick}
          sellerProfile={sellerProfile}
          sellerName={sellerName}
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={handleDeliveryMethodChange}
          onProductUpdate={handleProductUpdate}
        />
        
      </Layout>
    );
  }
  
  // Desktop Layout
  return (
    <Layout>
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
        />
        
        {/* Header */}
        <ProductDetailHeader 
          product={product}
          onBack={handleBack}
        />
        
        {/* Status warnings */}
        <ProductDetailAlerts 
          product={product}
          isOwner={isOwner}
          isAdmin={isAdmin}
        />
        
        {/* Main content */}
        <ProductDetailContent 
          product={product}
          imageUrls={imageUrls}
          videoUrls={videoUrls}
          selectedImage={selectedImage}
          onImageClick={handleImageClick}
          onProductUpdate={handleProductUpdate}
          sellerProfile={sellerProfile}
          sellerName={sellerName}
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={handleDeliveryMethodChange}
          language={language}
        />
        

        {/* Seller Products Section */}
        <SellerProducts 
          currentProductId={product.id}
          sellerId={product.seller_id}
          sellerName={sellerName}
        />
      </div>

      {/* Auth Prompt Overlay for unauthenticated users */}
      {!user && (
        <AuthPromptOverlay 
          language={language}
          onLogin={() => navigate('/login')}
          onRegister={() => navigate('/register')}
        />
      )}
    </Layout>
  );
};

export default ProductDetail;
