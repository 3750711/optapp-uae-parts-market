
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/utils/imageCompression";

export interface ImageUploadProps {
  images: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxImages?: number;
  storageBucket?: string;
  filePrefix?: string; // New prop for file prefix
  translations?: {
    limitExceeded: string;
    maxImagesText: string;
    success: string;
    uploadedText: string;
    error: string;
    uploadFailed: string;
    uploading: string;
    dragDropText: string;
    imagesUploaded: string;
    selectImages: string;
    selectFiles: string;
  };
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onUpload,
  onDelete,
  maxImages = 10,
  storageBucket = "product-images",
  filePrefix = "", // Default empty prefix
  translations
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Default Russian texts
  const t = translations || {
    limitExceeded: "Превышен лимит",
    maxImagesText: "Максимальное количество изображений:",
    success: "Успех",
    uploadedText: "Загружено {count} из {total} изображений",
    error: "Ошибка",
    uploadFailed: "Не удалось загрузить изображение",
    uploading: "Загрузка изображений...",
    dragDropText: "Нажмите или перетащите изображения для загрузки",
    imagesUploaded: "изображений загружено",
    selectImages: "Выбрать изображения",
    selectFiles: "Выберите файлы для загрузки"
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setProgress(0);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const files = Array.from(event.target.files);
      
      if (images.length + files.length > maxImages) {
        toast({
          title: t.limitExceeded,
          description: `${t.maxImagesText} ${maxImages}`,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Compress and upload each file
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Fix: Pass the compression options as separate parameters instead of as an object
          const compressedFile = await compressImage(
            file,
            1920, // maxWidth
            1920, // maxHeight
            0.8   // quality
          );

          const fileExt = file.name.split(".").pop();
          // Use prefix if provided
          const fileName = filePrefix ? `${filePrefix}_${uuidv4()}.${fileExt}` : `${uuidv4()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage
            .from(storageBucket)
            .upload(filePath, compressedFile);

          if (error) {
            throw error;
          }

          // Calculate progress for UI feedback
          setProgress(Math.round(((index + 1) / files.length) * 100));

          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(filePath);

          return publicUrlData.publicUrl;
        } catch (error) {
          console.error("Error processing file:", file.name, error);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        // Changed: Add new URLs to existing images instead of replacing them
        const updatedImages = [...images, ...validUrls];
        onUpload(updatedImages);
        toast({
          title: t.success,
          description: t.uploadedText.replace('{count}', validUrls.length.toString()).replace('{total}', files.length.toString()),
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: t.error,
        description: t.uploadFailed,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset the input value to allow uploading the same file again
      if (event.target.value) event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {uploading ? (
        <div className="bg-gray-50 border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t.uploading}</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
          <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4 text-center">
            {t.dragDropText}
            <br />
            <span className="text-xs">
              {images.length}/{maxImages} {t.imagesUploaded}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={images.length >= maxImages}
            className="relative"
          >
            {t.selectImages}
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading || images.length >= maxImages}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title={t.selectFiles}
            />
          </Button>
        </div>
      )}
    </div>
  );
};
