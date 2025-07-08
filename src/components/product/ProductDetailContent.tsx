
import React from "react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ContactButtons from "@/components/product/ContactButtons";
import EnhancedSellerInfo from "@/components/product/EnhancedSellerInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import { Product } from "@/types/product";
import { Database } from "@/integrations/supabase/types";

interface ProductDetailContentProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  onProductUpdate: () => void;
  sellerProfile: any;
  sellerName: string;
  deliveryMethod: Database["public"]["Enums"]["delivery_method"];
  onDeliveryMethodChange: (method: Database["public"]["Enums"]["delivery_method"]) => void;
}

const ProductDetailContent: React.FC<ProductDetailContentProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  onProductUpdate,
  sellerProfile,
  sellerName,
  deliveryMethod,
  onDeliveryMethodChange,
}) => {
  // Отладочная информация для проверки данных продавца
  console.log('ProductDetailContent seller data:', {
    productPhone: product.phone_url,
    productTelegram: product.telegram_url,
    sellerProfilePhone: sellerProfile?.phone,
    sellerProfileTelegram: sellerProfile?.telegram,
    sellerProfile: sellerProfile,
    sellerName,
    optStatus: sellerProfile?.opt_status
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery section - now includes videos */}
      <div className="space-y-6">
        <ProductGallery 
          images={imageUrls}
          videos={videoUrls}
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
        />
      </div>
      
      {/* Info section with better spacing */}
      <div className="space-y-8">
        <ProductInfo 
          product={product} 
          onProductUpdate={onProductUpdate}
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={onDeliveryMethodChange}
        />
        
        <EnhancedSellerInfo 
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
            avatar_url: sellerProfile?.avatar_url,
            communication_ability: sellerProfile?.communication_ability
          }}
          seller_name={sellerName}
          seller_id={product.seller_id}
        >
          <ContactButtons 
            sellerPhone={product.phone_url || sellerProfile?.phone}
            sellerTelegram={product.telegram_url || sellerProfile?.telegram}
            productTitle={product.title}
            isVerified={sellerProfile?.opt_status === 'verified'}
            verificationStatus={sellerProfile?.opt_status || 'pending'}
          />
        </EnhancedSellerInfo>
        
        {(product.brand || product.model || product.lot_number) && (
          <ProductSpecifications 
            brand={product.brand || "Не указано"}
            model={product.model || "Не указано"}
            lot_number={product.lot_number || 0}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetailContent;
