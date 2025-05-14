
import React from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";

interface ProductMediaManagerProps {
  productId: string;
  images: string[];
  videos: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onVideosChange: (videos: string[]) => void;
  maxImages: number;
}

const ProductMediaManager: React.FC<ProductMediaManagerProps> = ({
  productId,
  images,
  videos,
  onImageUpload,
  onImageDelete,
  onVideosChange,
  maxImages = 25
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <ImageUpload 
          images={images}
          onUpload={onImageUpload}
          onDelete={onImageDelete}
          maxImages={maxImages}
        />
      </div>
      <div>
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
