import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSellerProductLayout from '@/components/seller/mobile/MobileSellerProductLayout';
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductDetailHeader from "@/components/product/ProductDetailHeader";
import SellerProductActions from "@/components/seller/SellerProductActions";
import SellerOffersSummary from "@/components/seller/SellerOffersSummary";
import SellerProductContent from "@/components/seller/SellerProductContent";
import ProductDetailAlerts from "@/components/product/ProductDetailAlerts";
import { Product } from "@/types/product";

interface UnifiedProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  onProductUpdate: () => void;
  updateTitle: (value: string) => Promise<void>;
  updatePrice: (value: string | number) => Promise<void>;
  updateDescription: (value: string) => Promise<void>;
  updatePlaceNumber: (value: string) => Promise<void>;
  updateDeliveryPrice: (value: string | number) => Promise<void>;
  updateLocation: (value: string) => Promise<void>;
  onBack: () => void;
}

export const UnifiedProductLayout: React.FC<UnifiedProductLayoutProps> = (props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileSellerProductLayout
        product={props.product}
        imageUrls={props.imageUrls || []}
        videoUrls={props.videoUrls || []}
        selectedImage={props.selectedImage || (props.imageUrls && props.imageUrls[0]) || null}
        onImageClick={props.onImageClick}
        onProductUpdate={props.onProductUpdate}
        updateTitle={props.updateTitle}
        updatePrice={props.updatePrice}
        updateDescription={props.updateDescription}
        updatePlaceNumber={props.updatePlaceNumber}
        updateDeliveryPrice={props.updateDeliveryPrice}
        updateLocation={props.updateLocation}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ProductBreadcrumb
        productTitle={props.product.title}
        brand={props.product.brand}
        model={props.product.model}
        isSeller={true}
      />
      
      <ProductDetailHeader 
        product={props.product}
        onBack={props.onBack}
      />
      
      <ProductDetailAlerts 
        product={props.product}
        isOwner={true}
        isAdmin={false}
      />
      
      <SellerProductActions 
        product={props.product}
        onProductUpdate={props.onProductUpdate}
      />
      
      <SellerOffersSummary 
        productId={props.product.id}
      />
      
      <SellerProductContent 
        product={props.product}
        imageUrls={props.imageUrls}
        videoUrls={props.videoUrls}
        selectedImage={props.selectedImage}
        onImageClick={props.onImageClick}
      />
    </div>
  );
};