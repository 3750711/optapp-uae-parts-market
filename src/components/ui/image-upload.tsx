
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
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onUpload,
  onDelete,
  maxImages = 10,
  storageBucket = "product-images",
  filePrefix = "" // Default empty prefix
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
          title: "Превышен лимит",
          description: `Максимальное количество изображений: ${maxImages}`,
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
        onUpload(validUrls);
        toast({
          title: "Успех",
          description: `Загружено ${validUrls.length} из ${files.length} изображений`,
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
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
            <span className="text-sm font-medium">Загрузка изображений...</span>
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
            Нажмите или перетащите изображения для загрузки
            <br />
            <span className="text-xs">
              {images.length}/{maxImages} изображений загружено
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={images.length >= maxImages}
            className="relative"
          >
            Выбрать изображения
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading || images.length >= maxImages}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Выберите файлы для загрузки"
            />
          </Button>
        </div>
      )}
    </div>
  );
};
