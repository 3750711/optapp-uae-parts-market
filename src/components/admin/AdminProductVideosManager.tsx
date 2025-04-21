
import React, { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminProductVideosManagerProps {
  productId: string;
  videos: string[];
  onVideosChange: (urls: string[]) => void;
}

export const AdminProductVideosManager: React.FC<AdminProductVideosManagerProps> = ({
  productId,
  videos,
  onVideosChange,
}) => {
  const { toast } = useToast();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const handleVideoDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      let path = "";
      if (url.includes("product-videos")) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'product-videos') + 1).join('/');
      } else if (url.includes("order-videos")) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'order-videos') + 1).join('/');
      } else {
        path = url.split('/').slice(4).join('/');
      }
      await supabase.storage.from('product-videos').remove([path]);
      await supabase.from('product_videos').delete().eq('url', url).eq('product_id', productId);
      onVideosChange(videos.filter(vid => vid !== url));
      toast({ title: "Видео удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить видео",
        variant: "destructive",
      });
    } finally {
      setDeletingUrl(null);
    }
  };

  if (!videos.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-1">Видео</div>
      <div className="grid grid-cols-2 gap-2">
        {videos.map((vid, idx) => (
          <div key={vid} className="relative group rounded-md overflow-hidden border aspect-video bg-black">
            <video src={vid} controls className="w-full h-full object-cover"/>
            <button
              type="button"
              aria-label="Удалить видео"
              className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => handleVideoDelete(vid)}
              disabled={deletingUrl === vid}
            >
              <X size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

