import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import SellerProductContent from "@/components/seller/SellerProductContent";
import SellerProductActions from "@/components/seller/SellerProductActions";
import SellerOffersSummary from "@/components/seller/SellerOffersSummary";
import { Product } from "@/types/product";
import SellerLayout from "@/components/layout/SellerLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

const SellerProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
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
    queryFn: async () => {
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
        throw error;
      }
    },
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
  
  // Set the first image as selected if none is selected
  if (product.product_images?.length && !selectedImage) {
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
  const imageUrls = product.product_images 
    ? product.product_images.map(img => img.url) 
    : [];
  
  const videoUrls = product.product_videos 
    ? product.product_videos.map(video => video.url) 
    : [];
  
  const sellerName = product.seller_name || (profile?.full_name || "Неизвестный продавец");
  
  return (
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
    </SellerLayout>
  );
};

export default SellerProductDetail;