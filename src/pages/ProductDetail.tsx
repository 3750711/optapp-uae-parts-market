
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
import ProductDetailFullGallery from "@/components/product/ProductDetailFullGallery";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database } from "@/integrations/supabase/types";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const [searchParams] = useSearchParams();
  const fromSeller = searchParams.get("from") === "seller";
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<Database["public"]["Enums"]["delivery_method"]>("cargo_rf");
  
  const handleDeliveryMethodChange = (method: Database["public"]["Enums"]["delivery_method"]) => {
    console.log("Updating delivery method in ProductDetail:", method);
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
      console.error("Navigation error:", error);
      toast({
        title: "Ошибка навигации",
        description: "Не удалось вернуться назад. Перенаправляем на главную страницу.",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  // Product query
  const { data: product, isLoading, error, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) {
        console.error('No product ID provided');
        return null;
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
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching product:', error);
          throw error;
        }
        
        if (!data) {
          console.error('No product found with ID:', id);
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
        console.error("Error in product query:", error);
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
  const { data: sellerProfile } = useQuery({
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
          console.error('Error fetching seller profile:', error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error('Exception in seller profile query:', err);
        return null;
      }
    },
    enabled: !!product?.seller_id,
    retry: 1,
  });
  
  const handleProductUpdate = () => {
    console.log("Product updated, refreshing data");
  };
  
  // Loading state
  if (authLoading || (isLoading && !product)) {
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
  
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");
  const isOwner = user?.id === product.seller_id;
  
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
        />
        
        {/* Full Size Images Section */}
        <ProductDetailFullGallery 
          imageUrls={imageUrls}
          productTitle={product.title}
          onImageClick={handleImageClick}
        />
      </div>
    </Layout>
  );
};

export default ProductDetail;
