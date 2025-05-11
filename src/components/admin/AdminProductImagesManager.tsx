
import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    </div>
  );
};
