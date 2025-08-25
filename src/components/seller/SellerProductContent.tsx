import React from "react";
import ProductGallery from "@/components/product/ProductGallery";
import SellerProductInfo from "@/components/seller/SellerProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import { Product } from "@/types/product";

interface SellerProductContentProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  updatePrice: (value: string | number) => Promise<void>;
  updatePlaceNumber: (value: string | number) => Promise<void>;
  updateDeliveryPrice: (value: string | number) => Promise<void>;
}

const SellerProductContent: React.FC<SellerProductContentProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  updatePrice,
  updatePlaceNumber,
  updateDeliveryPrice,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Left Column - Gallery */}
      <div className="space-y-4">
        <ProductGallery
          images={imageUrls}
          videos={videoUrls}
          selectedImage={selectedImage}
          onImageClick={onImageClick}
          title={product.title}
          cloudinaryPublicId={product.cloudinary_public_id}
          cloudinaryUrl={product.cloudinary_url}
        />
      </div>
      
      {/* Right Column - Product Info */}
      <div className="space-y-6">
        <SellerProductInfo
          product={product}
          updatePrice={updatePrice}
          updatePlaceNumber={updatePlaceNumber}
          updateDeliveryPrice={updateDeliveryPrice}
        />
        
        {/* Specifications */}
        {(product.brand || product.model || product.lot_number) && (
          <ProductSpecifications
            brand={product.brand || ''}
            model={product.model || ''}
            lot_number={product.lot_number || 0}
          />
        )}
      </div>
    </div>
  );
};

export default SellerProductContent;