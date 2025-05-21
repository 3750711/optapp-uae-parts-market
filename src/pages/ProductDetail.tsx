import React, { useState, useEffect } from "react";
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
      // Check if there's history to go back to
      if (fromSeller) {
        navigate('/seller/listings');
      } else if (window.history.length > 2) {
        navigate(-1);
      } else {
        // Fallback to home page if there's no history
        navigate('/');
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to home page if navigation fails
      toast({
        title: "Ошибка навигации",
        description: "Не удалось вернуться назад. Перенаправляем на главную страницу.",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  // Wait for auth to be checked before fetching product data
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
          .maybeSingle(); // Using maybeSingle instead of single to avoid errors
        
        if (error) {
          console.error('Error fetching product:', error);
          throw error;
        }
        
        if (!data) {
          console.error('No product found with ID:', id);
          throw new Error('Product not found');
        }
        
        // Check if current user is the product creator/seller
        const isCreator = user?.id === data.seller_id;
        console.log("Is creator check:", isCreator, user?.id, data.seller_id);
        
        // Check product visibility based on status and user role/ownership
        // Allow creator to view their own products regardless of status
        if (data.status === 'pending' && !isCreator && !isAdmin) {
          console.log("Access denied: User is not product creator or admin for pending product");
          throw new Error('Access denied: Product is pending approval');
        }
        
        // Similar check for archived products
        if (data.status === 'archived' && !isCreator && !isAdmin) {
          console.log("Access denied: User is not product creator or admin for archived product");
          throw new Error('Access denied: Product is archived');
        }
        
        console.log("Fetched product details:", data);
        return data as Product;
      } catch (error) {
        console.error("Error in product query:", error);
        throw error;
      }
    },
    enabled: !!id && !authLoading, // Only run query when ID is available and auth check is completed
    retry: (failureCount, error) => {
      // Don't retry for access denied errors
      if (error instanceof Error && 
          (error.message.includes('Access denied') || 
           error.message.includes('Product not found'))) {
        return false;
      }
      // Otherwise retry up to 1 time (default from QueryClient)
      return failureCount < 1;
    },
  });
  
  // Handle navigation to 404 only after we're sure the product doesn't exist or access is denied
  useEffect(() => {
    if (isError && !isLoading && !authLoading) {
      // Add a small delay to prevent false negatives
      const timer = setTimeout(() => {
        navigate('/404');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isError, isLoading, authLoading, navigate]);
  
  // Query for seller profile with improved error handling
  const { data: sellerProfile } = useQuery({
    queryKey: ['sellerProfile', product?.seller_id],
    queryFn: async () => {
      if (!product?.seller_id) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', product.seller_id)
          .maybeSingle(); // Using maybeSingle to prevent errors when profile doesn't exist
          
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
    retry: 1, // Limit retries to avoid unnecessary requests
  });
  
  // Product update handler
  const handleProductUpdate = () => {
    // Refresh product data
    console.log("Product updated, refreshing data");
  };
  
  // Loading state - show during initial auth check or product loading
  if (authLoading || (isLoading && !product)) {
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
  
  // Show error message if product couldn't be loaded
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
  
  // Extract URLs from product_images for the ProductGallery component
  const imageUrls = product.product_images 
    ? product.product_images.map(img => img.url) 
    : [];
  
  // Extract URLs from product_videos for the ProductVideos component
  const videoUrls = product.product_videos 
    ? product.product_videos.map(video => video.url) 
    : [];
  
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");
  
  // Check if current user is the product creator/seller
  const isOwner = user?.id === product.seller_id;
  console.log("Is owner check on render:", isOwner, user?.id, product.seller_id);
  
  // Prepare values for ProductSpecifications component
  const brand = product.brand || "Не указано";
  const model = product.model || "Не указано";
  const lot_number = product.lot_number || 0;

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
              Это объявление ожидает проверки модераторами. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        {product.status === 'archived' && (isOwner || isAdmin) && (
          <Alert className="mb-6 bg-gray-50 border-gray-200">
            <AlertTitle>Объявление в архиве</AlertTitle>
            <AlertDescription>
              Это объявление находится в архиве. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ProductGallery 
              images={imageUrls} 
              title={product.title}
              selectedImage={selectedImage} 
              onImageClick={handleImageClick}
            />
            
            {videoUrls.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Видео</h3>
                <ProductVideos videos={videoUrls} />
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <ProductInfo 
              product={product} 
              onProductUpdate={handleProductUpdate}
            />
            
            <ContactButtons 
              onContactTelegram={() => window.open(`https://t.me/${product.telegram_url}`, '_blank')}
              onContactWhatsApp={() => window.open(`https://wa.me/${product.phone_url}`, '_blank')}
              telegramUrl={product.telegram_url}
              product={{
                id: product.id,
                title: product.title,
                price: Number(product.price),
                brand: product.brand || "",
                model: product.model || "",
                description: product.description,
                optid_created: product.optid_created,
                seller_id: product.seller_id,
                seller_name: product.seller_name,
                lot_number: product.lot_number,
                status: product.status,
                delivery_price: product.delivery_price || 0,
              }}
              deliveryMethod={deliveryMethod}
              onDeliveryMethodChange={handleDeliveryMethodChange}
            />
            
            <SellerInfo 
              sellerProfile={{
                id: product.seller_id,
                full_name: sellerName,
                rating: sellerProfile?.rating,
                opt_id: sellerProfile?.opt_id,
                opt_status: sellerProfile?.opt_status,
                description_user: sellerProfile?.description_user,
                telegram: sellerProfile?.telegram,
                phone: sellerProfile?.phone,
                location: sellerProfile?.location,
                avatar_url: sellerProfile?.avatar_url  // Added missing avatar_url property
              }}
              seller_name={sellerName}
              seller_id={product.seller_id}
            />
            
            {product.description && brand && model && lot_number && (
              <ProductSpecifications 
                brand={brand}
                model={model}
                lot_number={lot_number}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
