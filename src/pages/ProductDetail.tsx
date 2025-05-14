
import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import ProductInfo from "@/components/product/ProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import ProductGallery from "@/components/product/ProductGallery";
import ProductVideos from "@/components/product/ProductVideos";
import ContactButtons from "@/components/product/ContactButtons";
import SellerInfo from "@/components/product/SellerInfo";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const [searchParams] = useSearchParams();
  const fromSeller = searchParams.get("from") === "seller";
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('No product ID provided');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*),
          product_videos(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching product:', error);
        navigate('/404');
        return null;
      }
      
      if (!data) {
        console.error('No product found with ID:', id);
        navigate('/404');
        return null;
      }
      
      // Check if current user is the product creator/seller
      const isCreator = user?.id === data.seller_id;
      console.log("Is creator check:", isCreator, user?.id, data.seller_id);
      
      // Check product visibility based on status and user role/ownership
      // Allow creator to view their own products regardless of status
      if (data.status === 'pending' && !isCreator && !isAdmin) {
        console.log("Access denied: User is not product creator or admin for pending product");
        navigate('/404');
        return null;
      }
      
      // Similar check for archived products
      if (data.status === 'archived' && !isCreator && !isAdmin) {
        console.log("Access denied: User is not product creator or admin for archived product");
        navigate('/404');
        return null;
      }
      
      console.log("Fetched product details:", data);
      return data as Product;
    },
    enabled: !!id,
  });
  
  // Query for seller profile
  const { data: sellerProfile } = useQuery({
    queryKey: ['sellerProfile', product?.seller_id],
    queryFn: async () => {
      if (!product?.seller_id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.seller_id)
        .single();
        
      if (error) {
        console.error('Error fetching seller profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!product?.seller_id,
  });
  
  // Back button handler
  const handleBack = () => {
    if (fromSeller) {
      navigate('/seller/listings');
    } else {
      navigate(-1);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={handleBack} className="mr-2">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="w-full aspect-square rounded-lg" />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              
              <div className="py-4">
                <Skeleton className="h-10 w-full max-w-xs mb-2" />
                <Skeleton className="h-10 w-full max-w-xs" />
              </div>
              
              <div className="border rounded-lg p-4">
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    console.error('Query error:', error);
    navigate('/404');
    return null;
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
  
  const productImages = product.product_images || [];
  const productVideos = product.product_videos || [];
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");
  
  // Check if current user is the product creator/seller
  const isOwner = user?.id === product.seller_id;
  console.log("Is owner check on render:", isOwner, user?.id, product.seller_id);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-2">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-xl md:text-2xl font-bold truncate">{product.title}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {product.lot_number && (
              <Badge variant="outline" className="text-xs">
                Лот: {product.lot_number}
              </Badge>
            )}
            
            {product.status === 'pending' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                На проверке
              </Badge>
            )}
            
            {product.status === 'archived' && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                В архиве
              </Badge>
            )}
          </div>
        </div>
        
        {/* Status warning for product creators/admins */}
        {product.status === 'pending' && (isOwner || isAdmin) && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTitle>Объявление на проверке</AlertTitle>
            <AlertDescription>
              Это объявление ожидает проверки модераторами. {isOwner ? 'Только вы и администраторы можете его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        {product.status === 'archived' && (isOwner || isAdmin) && (
          <Alert className="mb-6 bg-gray-50 border-gray-200">
            <AlertTitle>Объявление в архиве</AlertTitle>
            <AlertDescription>
              Это объявление находится в архиве. {isOwner ? 'Только вы и администраторы можете его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ProductGallery 
              images={productImages} 
              selectedImage={selectedImage} 
              onImageClick={handleImageClick}
            />
            
            {productVideos && productVideos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Видео</h3>
                <ProductVideos videos={productVideos} />
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <ProductInfo product={product} />
            
            <ContactButtons 
              telegramUrl={product.telegram_url} 
              phoneUrl={product.phone_url}
              productTitle={product.title}
              sellerName={sellerName}
              isOwner={isOwner}
            />
            
            <SellerInfo sellerId={product.seller_id} sellerName={sellerName} sellerRating={product.rating_seller} />
            
            {product.description && (
              <ProductSpecifications description={product.description} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
