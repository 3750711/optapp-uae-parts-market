
import React from "react";
import { UnifiedProductImagesManager } from "@/components/product/UnifiedProductImagesManager";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";

interface ProductMediaManagerProps {
  productId: string;
  images: string[];
  videos: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onVideosChange: (videos: string[]) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  primaryImage?: string;
  maxImages?: number;
  storageBucket?: string;
}

const ProductMediaManager: React.FC<ProductMediaManagerProps> = ({
  productId,
  images,
  videos,
  onImageUpload,
  onImageDelete,
  onVideosChange,
  onPrimaryImageChange,
  primaryImage,
  maxImages = 25,
  storageBucket = "product-images"
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-medium mb-2">Фотографии</h3>
        <UnifiedProductImagesManager
          productId={productId}
          images={images}
          onImageUpload={onImageUpload}
          onImageDelete={onImageDelete}
          primaryImage={primaryImage}
          onPrimaryImageChange={onPrimaryImageChange}
          maxImages={maxImages}
          storageBucket={storageBucket}
        />
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Видео</h3>
        <AdminProductVideosManager
          productId={productId}
          videos={videos}
          onVideosChange={onVideosChange}
        />
      </div>
    </div>
  );
};

export default ProductMediaManager;
