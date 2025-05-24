
import React from "react";
import ProductGallery from "@/components/product/ProductGallery";
import ProductVideos from "@/components/product/ProductVideos";
import ProductInfo from "@/components/product/ProductInfo";
import ContactButtons from "@/components/product/ContactButtons";
import SellerInfo from "@/components/product/SellerInfo";
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery section */}
      <div className="space-y-6">
        <ProductGallery 
          images={imageUrls} 
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
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
          onProductUpdate={onProductUpdate}
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
          onDeliveryMethodChange={onDeliveryMethodChange}
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
  );
};

export default ProductDetailContent;
