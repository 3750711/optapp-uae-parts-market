
import React from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { ProductImagesGallery } from "./ProductImagesGallery";
import { useImageDeletion } from "./images/ImageDeletionHandler";
import { usePrimaryImage } from "./images/PrimaryImageHandler";
import { useImageUpload } from "./images/ImageUploadHandler";

interface UnifiedProductImagesManagerProps {
  productId: string;
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  primaryImage?: string;
  maxImages?: number;
  storageBucket?: string;
  showUpload?: boolean;
}

export const UnifiedProductImagesManager: React.FC<UnifiedProductImagesManagerProps> = ({
  productId,
  images,
  onImageUpload,
  onImageDelete,
  onPrimaryImageChange,
  primaryImage,
  maxImages = 25,
  storageBucket = "Product Images",
  showUpload = true
}) => {
  console.log("UnifiedProductImagesManager rendered with:", {
    productId,
    imagesCount: images.length,
    primaryImage,
    onPrimaryImageChange: !!onPrimaryImageChange
  });

  const { handleImageDelete, deletingImage } = useImageDeletion({
    productId,
    images,
    primaryImage,
    onImageDelete,
    onPrimaryImageChange
  });

  const { handleSetPrimaryImage, settingPrimary } = usePrimaryImage({
    productId,
    onPrimaryImageChange
  });

  const { handleImageUpload } = useImageUpload({
    productId,
    images,
    primaryImage,
    onImageUpload,
    onPrimaryImageChange
  });

  // Simple delete handler that doesn't duplicate primary image logic
  const simpleDeleteHandler = async (imageUrl: string) => {
    await handleImageDelete(imageUrl);
  };

  return (
    <div className="space-y-4">
      <ProductImagesGallery 
        images={images}
        onImageDelete={simpleDeleteHandler}
        onSetPrimaryImage={onPrimaryImageChange ? handleSetPrimaryImage : undefined}
        primaryImage={primaryImage}
        deletingImage={deletingImage}
        settingPrimary={settingPrimary}
      />

      {showUpload && (
        <ImageUpload 
          images={images}
          onUpload={handleImageUpload}
          onDelete={simpleDeleteHandler}
          maxImages={maxImages}
          storageBucket={storageBucket}
        />
      )}
    </div>
  );
};
