
import React, { useState } from "react";
import { ProductImagesManager } from "@/components/product/ProductImagesManager";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  storageBucket = "Product Images"
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Here we're invalidating the product cache to ensure all changes are reflected
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      console.log("All changes saved, cache invalidated");
      
      toast({
        title: "Успешно",
        description: "Все изменения сохранены",
      });
      setPendingChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Фотографии</h3>
          {pendingChanges && (
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить изменения
            </Button>
          )}
        </div>
        
        <ProductImagesManager
          productId={productId}
          images={images}
          onImageUpload={(newUrls) => {
            onImageUpload(newUrls);
            setPendingChanges(true);
          }}
          onImageDelete={(url) => {
            onImageDelete(url);
            setPendingChanges(true);
          }}
          primaryImage={primaryImage}
          onPrimaryImageChange={(url) => {
            if (onPrimaryImageChange) {
              onPrimaryImageChange(url);
              setPendingChanges(true);
            }
          }}
          maxImages={maxImages}
          storageBucket={storageBucket}
        />
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Видео</h3>
        <AdminProductVideosManager
          productId={productId}
          videos={videos}
          onVideosChange={(newVideos) => {
            onVideosChange(newVideos);
            setPendingChanges(true);
          }}
        />
      </div>
    </div>
  );
};

export default ProductMediaManager;
