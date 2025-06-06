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
import { useMobileOptimizedUpload } from "@/hooks/useMobileOptimizedUpload";
import { toast } from "@/hooks/use-toast";
import { STORAGE_BUCKETS } from "@/constants/storage";

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
  const [compressionQuality, setCompressionQuality] = useState<number | null>(null);

  const {
    isUploading,
    uploadProgress,
    canCancel,
    uploadFilesBatch,
    cancelUpload,
    retryFailedUploads,
    clearProgress,
    isMobileDevice,
    deviceCapabilities
  } = useMobileOptimizedUpload();

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

    // Check for large files
    const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024); // 5MB
    if (largeFiles.length > 0) {
      toast({
        title: "Большие файлы",
        description: `${largeFiles.length} файлов больше 5МБ. Они будут сжаты для мобильных устройств.`,
      });
    }

    setSelectedFiles(files);
    setShowPreview(true);
  }, [existingImages.length, maxImages]);

  // Start upload with Cloudinary integration
  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      const options = {
        storageBucket,
        storagePath,
        compressionQuality: compressionQuality || deviceCapabilities.compressionQuality,
        maxRetries: 3,
        batchSize: deviceCapabilities.batchSize,
        batchDelay: deviceCapabilities.isLowEnd ? 1500 : 500,
        productId: enableCloudinary ? productId : undefined,
        autoGeneratePreview: autoGeneratePreview && !!productId && enableCloudinary
      };

      console.log('🚀 Starting upload with Cloudinary integration:', {
        enableCloudinary,
        productId,
        autoGeneratePreview: options.autoGeneratePreview
      });

      const urls = await uploadFilesBatch(selectedFiles, options);
      
      if (urls.length > 0) {
        onUploadComplete(urls);
        
        setSelectedFiles([]);
        setShowPreview(false);
        clearProgress();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [selectedFiles, storageBucket, storagePath, compressionQuality, deviceCapabilities, uploadFilesBatch, onUploadComplete, clearProgress, productId, autoGeneratePreview, enableCloudinary]);

  // Handle setting primary image
  const handleSetPrimaryImage = async (url: string) => {
    if (onSetPrimaryImage) {
      onSetPrimaryImage(url);
    }
  };

  // Calculate overall progress
  const overallProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length
    : 0;

  const successCount = uploadProgress.filter(p => p.status === 'success').length;
  const errorCount = uploadProgress.filter(p => p.status === 'error').length;
  const pendingCount = uploadProgress.filter(p => p.status === 'pending').length;
  const uploadingCount = uploadProgress.filter(p => p.status === 'uploading' || p.status === 'retrying').length;
  const generatingPreviewCount = uploadProgress.filter(p => p.status === 'generating-preview').length;
  const previewsGenerated = uploadProgress.filter(p => p.hasPreview).length;

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Existing Images Gallery */}
      {existingImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Загруженные изображения ({existingImages.length}/{maxImages})
              {enableCloudinary && productId && (
                <Badge variant="secondary" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  Cloudinary
                </Badge>
              )}
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

      {/* Device Info Card - обновленная информация */}
      {isMobileDevice && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Camera className="h-4 w-4" />
              <span>Мобильный режим: оптимизация для {deviceCapabilities.memory}GB RAM</span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Пакеты по {deviceCapabilities.batchSize} файлов, качество {Math.round(deviceCapabilities.compressionQuality * 100)}%
            </div>
            {enableCloudinary && productId && (
              <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                <Cloud className="h-3 w-3" />
                <Sparkles className="h-3 w-3" />
                Автоматическая загрузка в Cloudinary с превью
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Controls */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || existingImages.length >= maxImages}
          className="flex-1"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          {enableCloudinary && productId ? 'Загрузить в Cloudinary' : 'Выбрать файлы'}
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
                Готово к загрузке: {selectedFiles.length} файлов
                {selectedFiles.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <Star className="h-3 w-3 mr-1" />
                    1-е = основное
                  </Badge>
                )}
                {enableCloudinary && productId && (
                  <Badge variant="outline" className="ml-2">
                    <Cloud className="h-3 w-3 mr-1" />
                    Cloudinary
                  </Badge>
                )}
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
            {/* Compression Quality Selector for Mobile */}
            {isMobileDevice && (
              <div>
                <label className="text-sm font-medium">Качество сжатия:</label>
                <div className="flex gap-2 mt-1">
                  {[0.4, 0.6, 0.8].map(quality => (
                    <Button
                      key={quality}
                      type="button"
                      variant={compressionQuality === quality ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCompressionQuality(quality)}
                    >
                      {Math.round(quality * 100)}%
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                  </div>
                  {file.size > 5 * 1024 * 1024 && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex gap-2">
              <Button
                onClick={startUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    {enableCloudinary && productId ? (
                      <Cloud className="mr-2 h-4 w-4" />
                    ) : (
                      <ImagePlus className="mr-2 h-4 w-4" />
                    )}
                    Загрузить {selectedFiles.length} файлов
                  </>
                )}
              </Button>
              
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={cancelUpload}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Прогресс загрузки
              {enableCloudinary && productId && (
                <Badge variant="outline" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  Cloudinary активен
                </Badge>
              )}
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
                  <Badge variant="success" className="flex items-center gap-1">
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
                {generatingPreviewCount > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {generatingPreviewCount} превью
                  </Badge>
                )}
                {previewsGenerated > 0 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Cloud className="h-3 w-3" />
                    {previewsGenerated} Cloudinary
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
                      {progress.hasPreview && (
                        <Badge variant="success" className="text-xs">
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
                  
                  {progress.status === 'generating-preview' && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Создание превью в Cloudinary...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {errorCount > 0 && !isUploading && (
              <Button
                variant="outline"
                onClick={() => retryFailedUploads({
                  storageBucket,
                  storagePath,
                  productId: enableCloudinary ? productId : undefined,
                  autoGeneratePreview: autoGeneratePreview && !!productId && enableCloudinary
                })}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить неудачные загрузки
              </Button>
            )}
            
            {!isUploading && (uploadProgress.every(p => p.status === 'success' || p.status === 'error')) && (
              <Button
                variant="outline"
                onClick={clearProgress}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить прогресс
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Info - обновим информацию */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Загружено: {existingImages.length} / {maxImages} изображений</div>
        <div>📸 Изображения автоматически сжимаются до 400KB</div>
        {enableCloudinary && productId && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            🖼️ Превью 20KB создается только для основного изображения
          </div>
        ) : (
          <div>🖼️ Превью создается автоматически после публикации товара</div>
        )}
        {isMobileDevice && (
          <div>💡 Совет: для экономии трафика изображения сжимаются автоматически</div>
        )}
      </div>
    </div>
  );
};
