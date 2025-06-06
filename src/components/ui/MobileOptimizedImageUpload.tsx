
import React, { useCallback, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ImagePlus, 
  X, 
  Camera, 
  AlertTriangle, 
  RefreshCw, 
  Pause,
  Play,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  ExternalLink,
  Sparkles,
  Star,
  Cloud
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { STORAGE_BUCKETS } from "@/constants/storage";
import { uploadDirectToCloudinary } from "@/utils/cloudinaryUpload";
import { getPreviewImageUrl, getBatchImageUrls } from "@/utils/cloudinaryUtils";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying' | 'processing';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  previewUrl?: string;
  isPrimary?: boolean;
  fileSize?: number;
  variants?: any;
}

interface MobileOptimizedImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket?: string;
  storagePath?: string;
  existingImages?: string[];
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
  autoGeneratePreview?: boolean;
  enableCloudinary?: boolean;
}

export const MobileOptimizedImageUpload: React.FC<MobileOptimizedImageUploadProps> = ({
  onUploadComplete,
  maxImages = 25,
  storageBucket = STORAGE_BUCKETS.PRODUCT_IMAGES,
  storagePath = "",
  existingImages = [],
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId,
  autoGeneratePreview = true,
  enableCloudinary = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Detect mobile device
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         window.innerWidth <= 768;

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check limits
    const totalAfterUpload = existingImages.length + files.length;
    if (totalAfterUpload > maxImages) {
      toast({
        title: "Превышен лимит",
        description: `Можно загрузить максимум ${maxImages} изображений. У вас уже ${existingImages.length}, пытаетесь добавить ${files.length}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast({
          title: "Неподдерживаемый файл",
          description: `Файл ${file.name} не является изображением`,
          variant: "destructive",
        });
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setShowPreview(true);

      // Show info about Cloudinary processing
      if (enableCloudinary) {
        toast({
          title: "Cloudinary интеграция",
          description: `${validFiles.length} файлов готовы к загрузке. Автоматическое сжатие до 400KB и создание превью 20KB.`,
        });
      }
    }
  }, [existingImages.length, maxImages, enableCloudinary]);

  // Upload single file directly to Cloudinary
  const uploadSingleFile = useCallback(async (
    file: File, 
    fileId: string,
    isPrimary: boolean = false
  ): Promise<string | null> => {
    try {
      console.log('🚀 Starting direct Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        isPrimary,
        productId
      });

      // Update progress
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 20, isPrimary, fileSize: file.size }
          : p
      ));

      // Create custom public_id
      const customPublicId = `product_${productId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Upload directly to Cloudinary
      const result = await uploadDirectToCloudinary(file, productId, customPublicId);

      if (result.success && result.cloudinaryUrl && result.publicId) {
        console.log('✅ Cloudinary upload successful:', {
          cloudinaryUrl: result.cloudinaryUrl,
          publicId: result.publicId,
          originalSize: result.originalSize,
          variants: result.variants
        });

        // Generate preview URL using public_id
        const previewUrl = getPreviewImageUrl(result.publicId);
        const batchUrls = getBatchImageUrls(result.publicId);

        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { 
                ...p, 
                status: 'success', 
                progress: 100,
                cloudinaryUrl: result.cloudinaryUrl,
                publicId: result.publicId,
                previewUrl,
                variants: batchUrls
              }
            : p
        ));

        return result.cloudinaryUrl;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('💥 Upload error:', errorMessage);

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'error', error: errorMessage }
          : p
      ));

      return null;
    }
  }, [productId]);

  // Start upload process
  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = selectedFiles.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      isPrimary: index === 0, // First file is primary
      fileSize: file.size
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];

    // Process files sequentially for better control
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const progressItem = initialProgress[i];
      
      try {
        const url = await uploadSingleFile(file, progressItem.fileId, progressItem.isPrimary);
        
        if (url) {
          uploadedUrls.push(url);
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }

      // Small delay between uploads
      if (i < selectedFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
      
      setSelectedFiles([]);
      setShowPreview(false);

      toast({
        title: "Загрузка завершена",
        description: `Успешно загружено ${uploadedUrls.length} из ${selectedFiles.length} файлов в Cloudinary с автоматическим сжатием.`,
      });
    }

    setIsUploading(false);
  }, [selectedFiles, uploadSingleFile, onUploadComplete]);

  // Handle setting primary image
  const handleSetPrimaryImage = async (url: string) => {
    if (onSetPrimaryImage) {
      onSetPrimaryImage(url);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate overall progress
  const overallProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length
    : 0;

  const successCount = uploadProgress.filter(p => p.status === 'success').length;
  const errorCount = uploadProgress.filter(p => p.status === 'error').length;
  const uploadingCount = uploadProgress.filter(p => p.status === 'uploading' || p.status === 'processing').length;

  return (
    <div className="space-y-4">
      {/* Existing Images Gallery */}
      {existingImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Загруженные изображения ({existingImages.length}/{maxImages})
              <Badge variant="secondary" className="text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Cloudinary
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {existingImages.map((url, index) => (
                <div 
                  key={url} 
                  className={`relative group rounded-md overflow-hidden border aspect-square ${
                    primaryImage === url ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img 
                    src={url} 
                    alt={`Фото ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  
                  {/* Mobile-friendly overlay controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                    {onSetPrimaryImage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0 touch-manipulation"
                        onClick={() => handleSetPrimaryImage(url)}
                        disabled={primaryImage === url}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onImageDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 rounded-full p-0 touch-manipulation"
                        onClick={() => onImageDelete(url)}
                        disabled={existingImages.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Primary image indicator */}
                  {primaryImage === url && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-80 p-1">
                      <p className="text-white text-xs text-center font-medium flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" />
                        Основное
                      </p>
                    </div>
                  )}
                  
                  {/* Mobile tap controls overlay for touch devices */}
                  {isMobileDevice && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      {onSetPrimaryImage && primaryImage !== url && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 rounded-full p-0 bg-white/90 hover:bg-white"
                          onClick={() => handleSetPrimaryImage(url)}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {onImageDelete && existingImages.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 rounded-full p-0 bg-red-500/90 hover:bg-red-500"
                          onClick={() => onImageDelete(url)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloudinary Integration Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Cloud className="h-4 w-4" />
            <Sparkles className="h-4 w-4" />
            <span>Полная интеграция с Cloudinary: автоматическое сжатие до 400KB</span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            • Основные изображения: сжатие с q_auto:low и f_auto
          </div>
          <div className="text-xs text-blue-600">
            • Превью: автоматическое создание версий 20KB в формате WebP
          </div>
          <div className="text-xs text-blue-600">
            • Без промежуточной загрузки в Supabase Storage
          </div>
        </CardContent>
      </Card>

      {/* Upload Controls */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || existingImages.length >= maxImages}
          className="flex-1"
        >
          <Cloud className="mr-2 h-4 w-4" />
          Загрузить в Cloudinary
        </Button>
        
        {isMobileDevice && (
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading || existingImages.length >= maxImages}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File Preview and Settings */}
      {showPreview && selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                Готово к загрузке в Cloudinary: {selectedFiles.length} файлов
                {selectedFiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <Star className="h-3 w-3 mr-1" />
                    1-е = основное
                  </Badge>
                )}
                <Badge variant="outline" className="ml-2">
                  <Cloud className="h-3 w-3 mr-1" />
                  400KB + 20KB превью
                </Badge>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFiles([]);
                  setShowPreview(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="truncate">{file.name}</span>
                    <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                    <Badge variant="outline" className="text-xs">
                      <Cloud className="h-3 w-3 mr-1" />
                      →400KB
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <Button
              onClick={startUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка в Cloudinary...
                </>
              ) : (
                <>
                  <Cloud className="mr-2 h-4 w-4" />
                  Загрузить {selectedFiles.length} файлов в Cloudinary
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Прогресс загрузки в Cloudinary
              <Badge variant="outline" className="text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Автоматическое сжатие
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Общий прогресс</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              
              {/* Status Summary */}
              <div className="flex flex-wrap gap-2 text-xs">
                {successCount > 0 && (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                    <CheckCircle className="h-3 w-3" />
                    {successCount} успешно
                  </Badge>
                )}
                {uploadingCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    {uploadingCount} загружается
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount} ошибок
                  </Badge>
                )}
              </div>
            </div>

            {/* Individual File Progress */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadProgress.map((progress) => (
                <div key={progress.fileId} className="border rounded p-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{progress.fileName}</span>
                    <div className="flex items-center gap-2">
                      {progress.isPrimary && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Основное
                        </Badge>
                      )}
                      {progress.cloudinaryUrl && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <Cloud className="h-3 w-3 mr-1" />
                          Cloudinary
                        </Badge>
                      )}
                      <span className="text-xs">{progress.progress}%</span>
                    </div>
                  </div>
                  
                  <Progress value={progress.progress} className="h-1" />
                  
                  {progress.status === 'error' && progress.error && (
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {progress.error}
                    </div>
                  )}
                  
                  {progress.fileSize && (
                    <div className="text-xs text-gray-500">
                      Оригинал: {formatFileSize(progress.fileSize)} → ~400KB + 20KB превью
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clear Progress Button */}
            {!isUploading && uploadProgress.every(p => p.status === 'success' || p.status === 'error') && (
              <Button
                variant="outline"
                onClick={() => setUploadProgress([])}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить прогресс
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Загружено: {existingImages.length} / {maxImages} изображений</div>
        <div className="flex items-center gap-1">
          <Cloud className="h-3 w-3 text-blue-500" />
          🎯 Все изображения автоматически сжимаются до ~400KB через Cloudinary
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-yellow-500" />
          🖼️ Превью 20KB создается автоматически в формате WebP
        </div>
        <div>💡 Никаких промежуточных загрузок - сразу в Cloudinary с оптимизацией</div>
      </div>
    </div>
  );
};
