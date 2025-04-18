
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  images: string[];
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onDelete,
  images,
  maxImages = 5
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (images.length + i >= maxImages) break;
        
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('order-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('order-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      onUpload(newUrls);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={url} className="relative group aspect-square">
            <img
              src={url}
              alt={`Order image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => onDelete(url)}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {images.length < maxImages && (
        <div className="flex items-center">
          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            className="hidden"
            onChange={uploadImages}
            disabled={isUploading}
          />
          <label
            htmlFor="images"
            className="cursor-pointer"
          >
            <Button 
              type="button"
              variant="outline"
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              {isUploading ? "Загрузка..." : "Добавить фото"}
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};
