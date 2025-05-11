
import React, { useState, useCallback } from "react";
import { X, Camera, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { preProcessImageForUpload } from "@/utils/imageCompression";

interface AdminProductImagesManagerProps {
  productId: string;
  images: string[];
  onImagesChange: (urls: string[]) => void;
}

export const AdminProductImagesManager: React.FC<AdminProductImagesManagerProps> = ({
  productId,
  images,
  onImagesChange,
}) => {
  const { toast } = useToast();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const handleImageDelete = useCallback(async (url: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive",
      });
      return;
    }
    setDeletingUrl(url);
    try {
      // Extract path from the URL for storage removal
      let path;
      if (url.includes('/order-images/')) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'order-images') + 1).join('/');
      } else if (url.includes('/product-images/')) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'product-images') + 1).join('/');  
      } else {
        // Fallback to original approach
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'storage') + 2).join('/');
      }
      
      const { error: storageErr } = await supabase.storage
        .from('order-images')
        .remove([path]);
        
      if (storageErr) throw storageErr;
      
      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('url', url)
        .eq('product_id', productId);
        
      if (dbErr) throw dbErr;
      
      onImagesChange(images.filter(img => img !== url));
      toast({ title: "Фото удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить фото",
        variant: "destructive",
      });
    } finally {
      setDeletingUrl(null);
    }
  }, [images, productId, onImagesChange, toast]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Ошибка",
            description: `${file.name} не является изображением`,
            variant: "destructive",
          });
          continue;
        }
        
        // Pre-process and optimize image
        const processedFile = await preProcessImageForUpload(file, 25, 5);
        
        // Generate a unique filename
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `admin-upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        
        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            contentType: processedFile.type,
          });
          
        if (error) {
          console.error("Upload error:", error);
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive",
          });
          continue;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        // Save reference in the database
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: publicUrl,
            is_primary: images.length === 0 // First image is primary if no images exist
          });
          
        if (dbError) {
          console.error("Database error:", dbError);
          toast({
            title: "Ошибка сохранения",
            description: dbError.message,
            variant: "destructive",
          });
          continue;
        }
        
        newUrls.push(publicUrl);
      }
      
      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        toast({ 
          title: "Успешно", 
          description: `Загружено ${newUrls.length} фото` 
        });
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast({
        title: "Ошибка",
        description: error?.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [images, productId, onImagesChange, toast]);

  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const openCameraDialog = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  if (!images.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-1">Фотографии</div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-md overflow-hidden border aspect-square">
            <img 
              src={img} 
              alt={`Фото ${idx + 1}`} 
              className="w-full h-full object-cover" 
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              aria-label="Удалить фото"
              className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => handleImageDelete(img)}
              disabled={deletingUrl === img}
            >
              <X size={16}/>
            </button>
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                <p className="text-white text-xs text-center">Главное фото</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        
        <input
          type="file"
          multiple
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        
        <Button
          type="button"
          variant="outline" 
          size="sm"
          disabled={isUploading}
          className="flex items-center gap-1 text-xs flex-1"
          onClick={openFileDialog}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ImagePlus className="h-3 w-3" />
          )}
          Галерея
        </Button>
        
        {isMobile() && (
          <Button
            type="button"
            variant="outline" 
            size="sm"
            disabled={isUploading}
            className="flex items-center gap-1 text-xs flex-1"
            onClick={openCameraDialog}
          >
            <Camera className="h-3 w-3" />
            Камера
          </Button>
        )}
      </div>
    </div>
  );
};

