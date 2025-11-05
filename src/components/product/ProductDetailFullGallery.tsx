import React from "react";
import ResponsivePicture from "@/components/ui/ResponsivePicture";

interface ProductDetailFullGalleryProps {
  imageUrls: string[];
  productTitle: string;
  onImageClick: (url: string) => void;
}

const ProductDetailFullGallery: React.FC<ProductDetailFullGalleryProps> = ({
  imageUrls,
  productTitle,
  onImageClick,
}) => {
  if (imageUrls.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-12">
      <h2 className="text-2xl font-bold text-foreground mb-8">Все фотографии товара</h2>
      <div className="space-y-4">
        {imageUrls.map((imageUrl, index) => (
          <div 
            key={index} 
            className="overflow-hidden cursor-pointer"
            onClick={() => onImageClick(imageUrl)}
          >
            <ResponsivePicture
              src={imageUrl}
              alt={`${productTitle} - фото ${index + 1}`}
              preset="gallery"
              className="w-full h-auto object-contain hover:opacity-90 transition-opacity duration-300"
              priority={index < 3}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetailFullGallery;
