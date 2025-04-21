
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VideoUploadProps {
  videos: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxVideos?: number;
  storageBucket: string;
  storagePrefix?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  videos,
  onUpload,
  onDelete,
  maxVideos = 3,
  storageBucket,
  storagePrefix = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || uploading) return;
    const files = Array.from(e.target.files);
    if (videos.length + files.length > maxVideos) {
      toast({
        title: "Ошибка",
        description: `Максимальное количество видео: ${maxVideos}`,
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${storagePrefix}${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
        const { error } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, file);
        if (error) {
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }
      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
        toast({ title: "Видео загружено" });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onDelete(url)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {videos.length < maxVideos && (
          <label className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-video">
            {uploading
              ? <Loader2 className="animate-spin h-6 w-6" />
              : (<>
                  <div className="text-2xl text-gray-400 font-bold">+</div>
                  <p className="text-xs text-gray-500">Добавить видео</p>
                </>)
            }
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">
        ДО {maxVideos} роликов, до 100 МБ каждый. Поддержка: mp4, mov, avi. Первое видео будет основным.
      </p>
    </div>
  );
};

export default VideoUpload;
