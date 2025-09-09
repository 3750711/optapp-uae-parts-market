import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeImageUploadProps {
  onUpload: (url: string) => void;
  onDelete?: (url: string) => void;
}

const RealTimeImageUpload: React.FC<RealTimeImageUploadProps> = ({ onUpload, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить изображение",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);
      
      setImageUrl(publicUrlData.publicUrl);
      onUpload(publicUrlData.publicUrl);
      toast({
        title: "Успех",
        description: "Изображение успешно загружено",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [onUpload, toast]);

  const handleRemove = useCallback(async () => {
    if (!imageUrl) return;
    setUploading(true);

    try {
      // Extract file path from public URL using utility
      const { extractStorageFilePath } = await import('@/utils/storageUrl');
      const filePath = extractStorageFilePath(imageUrl, 'product-images');
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить изображение",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      setImageUrl(null);
      if (onDelete) {
        onDelete(imageUrl);
      }
      toast({
        title: "Успех",
        description: "Изображение успешно удалено",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [imageUrl, onDelete, toast]);

  return (
    <div>
      {imageUrl ? (
        <div className="relative">
          <img src={imageUrl} alt="Uploaded" className="max-w-xs h-auto rounded-md" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <div className="relative border-2 border-dashed rounded-md p-4 text-center cursor-pointer">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">Загрузить изображение</p>
            </>
          )}
          <input
            type="file"
            accept="image/*,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              handleFileChange(e);
              e.target.value = "";
            }}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
};

export default RealTimeImageUpload;
