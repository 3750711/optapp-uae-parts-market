import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, MapPin } from "lucide-react";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";

import CompactSellerInfo from "./CompactSellerInfo";
import MobileActionButtons from "./MobileActionButtons";
import MobileCharacteristicsTable from "./MobileCharacteristicsTable";
import MobileStickyBuyButton from "./MobileStickyBuyButton";
import SellerProducts from "@/components/product/SimilarProducts";
import { Badge } from "@/components/ui/badge";

interface MobileProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  sellerProfile: any;
  sellerName: string;
  deliveryMethod: any;
  onDeliveryMethodChange: (method: any) => void;
  onProductUpdate: () => void;
}

const MobileProductLayout: React.FC<MobileProductLayoutProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  sellerProfile,
  sellerName,
  deliveryMethod,
  onDeliveryMethodChange,
  onProductUpdate,
}) => {
  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">На модерации</Badge>;
      case 'active':
        return <Badge variant="success" className="text-xs">В наличии</Badge>;
      case 'sold':
        return <Badge variant="info" className="text-xs">Продано</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-xs bg-gray-100">Архив</Badge>;
      default:
        return null;
    }
  };

  const handleContactSeller = () => {
    // TODO: Implement contact seller functionality
    console.log('Contact seller');
  };

  const handleMakeOffer = () => {
    // TODO: Implement make offer functionality
    console.log('Make offer');
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    console.log('Buy now');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="p-4">
          {/* Full title */}
          <h1 className="text-lg font-bold text-foreground mb-2">
            {[product.brand, product.model, product.title].filter(Boolean).join(' ')}
          </h1>
          
          {/* Price + Status on one line */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold text-primary">{product.price} $</span>
            {getStatusBadge()}
          </div>
          
          {/* Location in small font */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {product.product_location || "Dubai"}
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white mb-2">
        <ProductGallery 
          images={imageUrls}
          videos={videoUrls}
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
        />
      </div>

      {/* Action Buttons */}
      <MobileActionButtons
        product={product}
        onContactSeller={handleContactSeller}
        onMakeOffer={handleMakeOffer}
        onBuyNow={handleBuyNow}
      />

      {/* Characteristics */}
      {(product.brand || product.model || product.lot_number) && (
        <MobileCharacteristicsTable product={product} />
      )}

      {/* Product Description */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Описание товара
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {product.description || (
              <span className="text-muted-foreground italic">
                Описание не добавлено продавцом
              </span>
            )}
          </p>
        </CardContent>
      </Card>



      {/* Delivery Info - Compact */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Доставка:</span>
          <span>
            {deliveryMethod === 'cargo_rf' ? 'Карго до РФ' : 
             deliveryMethod === 'self_pickup' ? 'Самовывоз' : 'Не указано'}
          </span>
          {product.delivery_price && (
            <span className="text-primary font-medium">
              — ${product.delivery_price}
            </span>
          )}
        </div>
      </div>

      {/* Seller Info */}
      <CompactSellerInfo
        sellerProfile={sellerProfile}
        sellerName={sellerName}
        sellerId={product.seller_id}
        productTitle={product.title}
        productId={product.id}
      />

      {/* Seller Products */}
      <SellerProducts 
        currentProductId={product.id}
        sellerId={product.seller_id}
        sellerName={sellerName}
      />

      {/* Bottom padding for sticky buy button */}
      <div className="h-20"></div>

      {/* Sticky Buy Button */}
      <MobileStickyBuyButton 
        product={product}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
};

export default MobileProductLayout;