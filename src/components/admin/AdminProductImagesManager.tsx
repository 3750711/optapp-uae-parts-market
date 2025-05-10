
import React, { useState, useEffect } from "react";
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

  const handleImageDelete = async (url: string) => {
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
      console.log('Attempting to delete image:', url);
      
      // Extract path more reliably
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const startIndex = pathParts.findIndex(p => p === 'order-images');
      
      if (startIndex === -1) {
        throw new Error('Could not determine storage path from URL');
      }
      
      const path = pathParts.slice(startIndex + 1).join('/');
      console.log('Extracted storage path:', path);
      
      const { error: storageErr } = await supabase.storage.from('order-images').remove([path]);
      if (storageErr) {
        console.error('Storage error during deletion:', storageErr);
        throw storageErr;
      }
      
      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('url', url)
        .eq('product_id', productId);
        
      if (dbErr) {
        console.error('Database error during deletion:', dbErr);
        throw dbErr;
      }
      
      console.log('Image deleted successfully');
      onImagesChange(images.filter(img => img !== url));
      toast({ title: "Фото удалено" });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить фото",
        variant: "destructive",
      });
    } finally {
      setDeletingUrl(null);
    }
  };

  if (!images.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-1">Фотографии</div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-md overflow-hidden border aspect-square">
            <img src={img} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              aria-label="Удалить фото"
              className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => handleImageDelete(img)}
              disabled={deletingUrl === img}
            >
              <X size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
