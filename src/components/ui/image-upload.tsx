
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
  maxImages = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const files = event.target.files;
      if (!files || files.length === 0) return;

      console.log(`Selected ${files.length} files for upload`);
      
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (images.length + newUrls.length >= maxImages) {
          toast({
            title: "Предупреждение",
            description: `Достигнуто максимальное количество изображений (${maxImages})`,
          });
          break;
        }
        
        const file = files[i];
        console.log(`Processing file ${i+1}/${files.length}: ${file.name}, type: ${file.type}, size: ${Math.round(file.size/1024)}KB`);
        
        // Compress image if it's larger than 1MB
        let fileToUpload = file;
        if (file.size > 1024 * 1024 && file.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file);
            console.log(`Compressed image from ${Math.round(file.size/1024)}KB to ${Math.round(fileToUpload.size/1024)}KB`);
          } catch (compressError) {
            console.error('Error compressing image:', compressError);
            // Continue with original file if compression fails
            fileToUpload = file;
          }
        }
        
        // Generate unique filename to avoid conflicts
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        console.log(`Uploading file to path: ${filePath}`);

        const { error: uploadError, data } = await supabase.storage
          .from('order-images')
          .upload(filePath, fileToUpload, {
            contentType: file.type, // Explicitly set content type
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully, getting public URL');
        
        const { data: { publicUrl } } = supabase.storage
          .from('order-images')
          .getPublicUrl(filePath);

        console.log('Generated public URL:', publicUrl);
        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        console.log(`Successfully uploaded ${newUrls.length} images`);
        onUpload(newUrls);
        toast({
          title: "Успешно",
          description: `Загружено ${newUrls.length} изображений`,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение. Проверьте подключение к интернету и повторите попытку.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input after upload
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper function to compress images
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              resolve(compressedFile);
            },
            file.type,
            0.7 // Quality (0.7 = 70% quality)
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = event.target.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async (url: string) => {
    try {
      // Extract the filename from the URL
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('order-images')
          .remove([fileName]);
      }
      onDelete(url);
      toast({
        title: "Успешно",
        description: "Изображение удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
    }
  };

  // Function to trigger the file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
              onClick={() => handleDelete(url)}
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
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={uploadImages}
            disabled={isUploading}
            capture="environment"
          />
          <Button 
            type="button"
            variant="outline"
            disabled={isUploading}
            className="flex items-center gap-2"
            onClick={handleButtonClick}
          >
            <ImagePlus className="h-4 w-4" />
            {isUploading ? "Загрузка..." : "Добавить фото"}
          </Button>
        </div>
      )}
    </div>
  );
};
