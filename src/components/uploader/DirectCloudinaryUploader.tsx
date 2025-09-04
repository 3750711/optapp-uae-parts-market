import React, { useState, useRef, useCallback } from "react";
import { uploadUnsignedDirect, UnsignedUploadResult } from "@/utils/unsignedCloudinaryUpload";
import { toast } from "@/hooks/use-toast";
import { Loader, Camera, X, RefreshCw } from "lucide-react";

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
  blobUrl?: string;
}

interface DirectCloudinaryUploaderProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
  buttonText?: string;
}

export default function DirectCloudinaryUploader({
  images,
  onImagesUpload,
  onImageDelete,
  disabled = false,
  maxImages = 25,
  buttonText = "Загрузить фото"
}: DirectCloudinaryUploaderProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!files.length) return;

    // Check total limit
    const totalImages = images.length + uploadItems.filter(item => item.status === 'completed').length + files.length;
    if (totalImages > maxImages) {
      toast({
        title: "Слишком много изображений",
        description: `Максимально можно загрузить ${maxImages} изображений`,
        variant: "destructive",
      });
      return;
    }

    // Create upload items
    const newItems: UploadItem[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0,
      blobUrl: URL.createObjectURL(file)
    }));

    setUploadItems(prev => [...prev, ...newItems]);
    setIsUploading(true);

    // Start uploads
    for (const item of newItems) {
      try {
        // Update status to uploading
        setUploadItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'uploading' as const } : i
        ));

        const result = await uploadUnsignedDirect(item.file, (progress) => {
          setUploadItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, progress } : i
          ));
        });

        if (result.success && result.url) {
          // Update item as completed
          setUploadItems(prev => prev.map(i =>
            i.id === item.id ? { 
              ...i, 
              status: 'completed' as const, 
              url: result.url,
              progress: 100 
            } : i
          ));

          // Update parent component with new URL
          onImagesUpload([...images, result.url]);
        } else {
          // Update item as error
          setUploadItems(prev => prev.map(i =>
            i.id === item.id ? { 
              ...i, 
              status: 'error' as const, 
              error: result.error || 'Upload failed'
            } : i
          ));
        }
      } catch (error) {
        setUploadItems(prev => prev.map(i =>
          i.id === item.id ? { 
            ...i, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : i
        ));
      }
    }

    setIsUploading(false);
  }, [images, onImagesUpload, maxImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Filter only image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length !== files.length) {
        toast({
          title: "Неподдерживаемые файлы",
          description: "Выберите только изображения",
          variant: "destructive",
        });
      }
      handleFileSelect(imageFiles);
    }
    // Reset input
    e.target.value = '';
  };

  const removeUploadItem = (itemId: string) => {
    setUploadItems(prev => {
      const itemToRemove = prev.find(i => i.id === itemId);
      if (itemToRemove?.blobUrl) {
        URL.revokeObjectURL(itemToRemove.blobUrl);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const retryUpload = async (itemId: string) => {
    const item = uploadItems.find(i => i.id === itemId);
    if (!item) return;

    setUploadItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: 'uploading' as const, progress: 0, error: undefined } : i
    ));

    try {
      const result = await uploadUnsignedDirect(item.file, (progress) => {
        setUploadItems(prev => prev.map(i =>
          i.id === itemId ? { ...i, progress } : i
        ));
      });

      if (result.success && result.url) {
        setUploadItems(prev => prev.map(i =>
          i.id === itemId ? { 
            ...i, 
            status: 'completed' as const, 
            url: result.url,
            progress: 100 
          } : i
        ));

        onImagesUpload([...images, result.url]);
      } else {
        setUploadItems(prev => prev.map(i =>
          i.id === itemId ? { 
            ...i, 
            status: 'error' as const, 
            error: result.error || 'Upload failed'
          } : i
        ));
      }
    } catch (error) {
      setUploadItems(prev => prev.map(i =>
        i.id === itemId ? { 
          ...i, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : i
      ));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="h-4 w-4" />
          {buttonText}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              {onImageDelete && (
                <button
                  type="button"
                  onClick={() => onImageDelete(imageUrl)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Items */}
      {uploadItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {uploadItems.map((item) => (
            <div key={item.id} className="relative aspect-square">
              {/* Preview */}
              {item.blobUrl && (
                <img
                  src={item.blobUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
              )}
              
              {/* Status Overlay */}
              {item.status !== 'completed' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                  {item.status === 'uploading' && (
                    <div className="text-white text-center">
                      <Loader className="h-6 w-6 animate-spin mx-auto mb-1" />
                      <div className="text-xs">{item.progress}%</div>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="text-white text-center p-2">
                      <div className="text-xs mb-2">Ошибка</div>
                      <button
                        onClick={() => retryUpload(item.id)}
                        className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                  )}
                  {item.status === 'pending' && (
                    <div className="text-white text-xs">В очереди...</div>
                  )}
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeUploadItem(item.id)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
