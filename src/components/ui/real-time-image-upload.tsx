
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, RotateCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { uploadImageRealtime, isImage } from "@/utils/imageCompression";
import { cn } from "@/lib/utils";
import { AdminProductImagesManager } from "@/components/admin/AdminProductImagesManager";

interface RealtimeImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket?: string;
  storagePath?: string;
}

export const RealtimeImageUpload: React.FC<RealtimeImageUploadProps> = ({
  onUploadComplete,
  maxImages = 30,
  storageBucket = "product-images",
  storagePath = "temp"
}) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check for maximum images limit
    const totalCount = uploadedImages.length + files.length;
    if (totalCount > maxImages) {
      toast({
        title: "Ограничение на количество изображений",
        description: `Можно загрузить максимум ${maxImages} изображений`,
        variant: "destructive",
      });
      return;
    }
    
    // Filter valid images and check size limits
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      if (!isImage(file)) {
        toast({
          title: "Неверный формат файла",
          description: `${file.name} не является изображением`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Файл слишком большой",
          description: `${file.name} больше 10MB`,
          variant: "destructive",
        });
        return;
      }
      
      validFiles.push(file);
    });
    
    if (validFiles.length === 0) return;
    
    // Add files to queue and start uploading if not already doing so
    setUploadQueue(prev => [...prev, ...validFiles]);
    if (!uploading) {
      processUploadQueue([...uploadQueue, ...validFiles]);
    }
  };
  
  const processUploadQueue = async (queue: File[]) => {
    if (queue.length === 0) return;
    
    setUploading(true);
    const newUploadProgress = new Map(uploadProgress);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of queue) {
        const fileId = `${file.name}-${Date.now()}`;
        newUploadProgress.set(fileId, 0);
        setUploadProgress(new Map(newUploadProgress));
        
        try {
          const url = await uploadImageRealtime(
            file,
            storageBucket,
            storagePath,
            (progress) => {
              newUploadProgress.set(fileId, progress);
              setUploadProgress(new Map(newUploadProgress));
            }
          );
          
          uploadedUrls.push(url);
          newUploadProgress.delete(fileId);
          setUploadProgress(new Map(newUploadProgress));
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${file.name}`,
            variant: "destructive",
          });
          newUploadProgress.delete(fileId);
          setUploadProgress(new Map(newUploadProgress));
        }
      }
      
      if (uploadedUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadedUrls]);
        onUploadComplete(uploadedUrls);
      }
    } finally {
      setUploading(false);
      setUploadQueue([]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const removeImage = (url: string) => {
    setUploadedImages(uploadedImages.filter(img => img !== url));
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {uploadedImages.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border group">
            <img 
              src={url} 
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            {index === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                <p className="text-white text-xs text-center">Главное фото</p>
              </div>
            )}
          </div>
        ))}
        
        {/* Display files that are currently uploading */}
        {Array.from(uploadProgress).map(([fileId, progress]) => (
          <div key={fileId} className="relative aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
        ))}
        
        {uploadedImages.length + uploadProgress.size < maxImages && (
          <div 
            onClick={openFileDialog}
            className={cn(
              "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="text-3xl text-gray-300">+</div>
            <p className="text-sm text-gray-500">Добавить фото</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={uploading}
        capture="environment"
      />
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex items-center gap-2 w-full md:w-auto"
          onClick={openFileDialog}
          disabled={uploading || uploadedImages.length >= maxImages}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              Добавить фото
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500">
        Загрузка происходит сразу после выбора изображений. Максимум {maxImages} изображений. Первое изображение будет главным.
      </p>
    </div>
  );
};
