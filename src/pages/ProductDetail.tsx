import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import ProductInfo from "@/components/product/ProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import ProductGallery from "@/components/product/ProductGallery";
import ProductVideos from "@/components/product/ProductVideos";
import ContactButtons from "@/components/product/ContactButtons";
import SellerInfo from "@/components/product/SellerInfo";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductSEO from "@/components/seo/ProductSEO";
import ProductSkeleton from "@/components/product/ProductSkeleton";
import ProductStatusBadge from "@/components/product/ProductStatusBadge";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database } from "@/integrations/supabase/types";
import OptimizedImage from "@/components/ui/OptimizedImage";

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
  
  // Построить заголовок с маркой и моделью
  const buildTitle = () => {
    let title = product.title;
    
    if (product.brand && product.model) {
      title = `${title} - ${product.brand} ${product.model}`;
    } else if (product.brand) {
      title = `${title} - ${product.brand}`;
    }
    
    return title;
  };
  
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
        
        {/* Header with improved layout */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div className="flex items-center flex-1">
            <Button variant="ghost" onClick={handleBack} className="mr-3 shrink-0">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
              {buildTitle()}
            </h1>
          </div>
          
          {/* Status and lot badges */}
          <div className="flex items-center gap-3 shrink-0">
            {product.lot_number && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                Лот: {product.lot_number}
              </div>
            )}
            <ProductStatusBadge status={product.status} size="md" />
          </div>
        </div>
        
        {/* Status warnings for creators/admins */}
        {product.status === 'pending' && (isOwner || isAdmin) && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200 animate-fade-in">
            <AlertTitle className="text-yellow-800">Объявление на проверке</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Это объявление ожидает проверки модераторами. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        {product.status === 'archived' && (isOwner || isAdmin) && (
          <Alert className="mb-6 bg-gray-50 border-gray-200 animate-fade-in">
            <AlertTitle className="text-gray-800">Объявление в архиве</AlertTitle>
            <AlertDescription className="text-gray-600">
              Это объявление находится в архиве. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main content grid with improved spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery section */}
          <div className="space-y-6">
            <ProductGallery 
              images={imageUrls} 
              title={product.title}
              selectedImage={selectedImage} 
              onImageClick={handleImageClick}
            />
            
            {videoUrls.length > 0 && (
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Видео</h3>
                <ProductVideos videos={videoUrls} />
              </div>
            )}
          </div>
          
          {/* Info section with better spacing */}
          <div className="space-y-8">
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
                avatar_url: sellerProfile?.avatar_url
              }}
              seller_name={sellerName}
              seller_id={product.seller_id}
            />
            
            {(product.brand || product.model || product.lot_number) && (
              <ProductSpecifications 
                brand={product.brand || "Не указано"}
                model={product.model || "Не указано"}
                lot_number={product.lot_number || 0}
              />
            )}
          </div>
        </div>
        
        {/* Full Size Images Section */}
        {imageUrls.length > 0 && (
          <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-foreground mb-8">Все фотографии товара</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageUrls.map((imageUrl, index) => (
                <div key={index} className="overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <OptimizedImage
                    src={imageUrl}
                    alt={`${product.title} - фото ${index + 1}`}
                    className="w-full h-auto aspect-square object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => handleImageClick(imageUrl)}
                    priority={index < 3}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
