import React, { useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductDetailHeader from "@/components/product/ProductDetailHeader";
import ProductDetailAlerts from "@/components/product/ProductDetailAlerts";
import ProductDetailContent from "@/components/product/ProductDetailContent";
import MobileProductLayout from "@/components/product/mobile/MobileProductLayout";
import { Product } from "@/types/product";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import { Database } from "@/integrations/supabase/types";
import { AuthPromptOverlay } from "@/components/product/AuthPromptOverlay";
import { Lang } from "@/types/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import GalleryErrorBoundary from "@/components/error/GalleryErrorBoundary";
import SellerProductsErrorBoundary from "@/components/error/SellerProductsErrorBoundary";

// Lazy load SellerProducts for better performance (desktop only)
const SellerProducts = lazy(() => import("@/components/product/SimilarProducts"));

interface ProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  sellerProfile: any;
  sellerName: string;
  isOwner: boolean;
  isAdmin: boolean;
  user: any;
  language: Lang;
  onProductUpdate: () => void;
}

const ProductLayout: React.FC<ProductLayoutProps> = ({
  product,
  imageUrls,
  videoUrls,
  sellerProfile,
  sellerName,
  isOwner,
  isAdmin,
  user,
  language,
  onProductUpdate,
}) => {
  const navigate = useNavigate();
  const { isMobile } = useMobileLayout();
  const [searchParams] = useSearchParams();
  const fromSeller = searchParams.get("from") === "seller";
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<Database["public"]["Enums"]["delivery_method"]>("cargo_rf");
  
  const handleDeliveryMethodChange = (method: Database["public"]["Enums"]["delivery_method"]) => {
    setDeliveryMethod(method);
  };
  
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
  
  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };
  
  // ❌ MOBILE VERSION - NO CHANGES!
  if (isMobile) {
    return (
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
        onProductUpdate={onProductUpdate}
        user={user}
      />
    );
  }
  
  // ✅ DESKTOP VERSION
  return (
    <>
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
        <GalleryErrorBoundary>
          <ProductDetailContent 
            product={product}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            selectedImage={selectedImage}
            onImageClick={handleImageClick}
            onProductUpdate={onProductUpdate}
            sellerProfile={sellerProfile}
            sellerName={sellerName}
            deliveryMethod={deliveryMethod}
            onDeliveryMethodChange={handleDeliveryMethodChange}
            language={language}
            user={user}
          />
        </GalleryErrorBoundary>
        
        {/* Seller Products Section - Lazy loaded for better performance */}
        <SellerProductsErrorBoundary>
          <Suspense fallback={
            <div className="mt-8 space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          }>
            <SellerProducts 
              currentProductId={product.id}
              sellerId={product.seller_id}
              sellerName={sellerName}
            />
          </Suspense>
        </SellerProductsErrorBoundary>
      </div>

      {/* Auth Prompt Overlay for unauthenticated users */}
      {!user && (
        <AuthPromptOverlay 
          language={language}
          onLogin={() => {
            const currentPath = window.location.pathname;
            navigate(`/login?from=${encodeURIComponent(currentPath)}`);
          }}
          onRegister={() => {
            const currentPath = window.location.pathname;
            navigate(`/register?from=${encodeURIComponent(currentPath)}`);
          }}
        />
      )}
    </>
  );
};

export default ProductLayout;
