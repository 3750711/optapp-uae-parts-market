import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ProductSEO from "@/components/seo/ProductSEO";
import ProductSkeleton from "@/components/product/ProductSkeleton";
import { useOptimizedProductImages } from "@/hooks/useOptimizedProductImages";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/useLanguage";
import ProductLayout from "@/components/product/ProductLayout";
import { useProductViewTracking } from "@/hooks/useProductViewTracking";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { language } = useLanguage();

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
  
  // Track product view with intelligent debouncing (once per 24h)
  useProductViewTracking(product?.id, user?.id);
  
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
  
  // Extract URLs for components
  const imageUrls = product.product_images 
    ? product.product_images.map(img => img.url) 
    : [];
  
  const videoUrls = product.product_videos 
    ? product.product_videos.map(video => video.url) 
    : [];
  
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");
  const isOwner = user?.id === product.seller_id;
  
  const handleProductUpdate = () => {
    // Product update handled by React Query cache invalidation
  };
  
  // Render layout
  return (
    <Layout>
      {/* SEO Component */}
      <ProductSEO 
        product={product}
        sellerName={sellerName}
        images={imageUrls}
      />
      
      {/* Layout component handles mobile/desktop rendering */}
      <ProductLayout
        product={product}
        imageUrls={imageUrls}
        videoUrls={videoUrls}
        sellerProfile={sellerProfile}
        sellerName={sellerName}
        isOwner={isOwner}
        isAdmin={isAdmin}
        user={user}
        language={language}
        onProductUpdate={handleProductUpdate}
      />
    </Layout>
  );
};

export default ProductDetail;
