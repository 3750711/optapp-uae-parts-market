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
  Sparkles
} from "lucide-react";
import { useMobileOptimizedUpload } from "@/hooks/useMobileOptimizedUpload";
import { toast } from "@/hooks/use-toast";
import { STORAGE_BUCKETS } from "@/constants/storage";
import { generateProductPreview, updateProductPreview } from "@/utils/previewGenerator";

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
  autoGeneratePreview = true
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

  // Start upload with automatic preview generation
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
        productId: productId,
        autoGeneratePreview: autoGeneratePreview && !!productId
      };

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
  }, [selectedFiles, storageBucket, storagePath, compressionQuality, deviceCapabilities, uploadFilesBatch, onUploadComplete, clearProgress, productId, autoGeneratePreview]);

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
            <CardTitle className="text-sm">
              Загруженные изображения ({existingImages.length}/{maxImages})
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
                        title={primaryImage === url ? "Уже основное" : "Сделать основным"}
                      >
                        <Check className="h-4 w-4" />
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
                        title="Удалить изображение"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Primary image indicator */}
                  {primaryImage === url && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-80 p-1">
                      <p className="text-white text-xs text-center font-medium">Основное</p>
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
                          <Check className="h-3 w-3" />
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

      {/* Device Info Card - добавим информацию о превью */}
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
            {productId && autoGeneratePreview && (
              <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Автоматическая генерация превью включена
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
          Выбрать файлы
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
              <CardTitle className="text-sm">
                Готово к загрузке: {selectedFiles.length} файлов
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
            <Button 
              type="button"
              onClick={startUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Загрузить {selectedFiles.length} файлов
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Загрузка файлов: {successCount + errorCount} / {uploadProgress.length}
              </CardTitle>
              {canCancel && (
                <Button type="button" variant="outline" size="sm" onClick={cancelUpload}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Общий прогресс</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Status Summary - добавим статус генерации превью */}
            <div className="flex gap-4 text-sm flex-wrap">
              {successCount > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>{successCount} готово</span>
                </div>
              )}
              {uploadingCount > 0 && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Clock className="h-3 w-3" />
                  <span>{uploadingCount} загружается</span>
                </div>
              )}
              {generatingPreviewCount > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  <span>{generatingPreviewCount} превью</span>
                </div>
              )}
              {previewsGenerated > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Sparkles className="h-3 w-3" />
                  <span>{previewsGenerated} превью готово</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  <span>{errorCount} ошибок</span>
                </div>
              )}
            </div>

            {/* Individual File Progress */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadProgress.map((progress) => (
                <div key={progress.fileId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1">{progress.fileName}</span>
                    <div className="flex items-center gap-1">
                      {progress.status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                      {progress.status === 'error' && <XCircle className="h-3 w-3 text-red-600" />}
                      {progress.status === 'uploading' && <Clock className="h-3 w-3 text-blue-600 animate-spin" />}
                      {progress.status === 'retrying' && <RefreshCw className="h-3 w-3 text-amber-600 animate-spin" />}
                      {progress.status === 'generating-preview' && <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />}
                      <span>{progress.progress}%</span>
                    </div>
                  </div>
                  <Progress value={progress.progress} className="h-1" />
                  {progress.error && (
                    <div className="text-xs text-red-600">{progress.error}</div>
                  )}
                  {progress.hasPreview && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Превью создано
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Retry Failed Button */}
            {errorCount > 0 && !isUploading && (
              <Button 
                type="button"
                variant="outline" 
                onClick={() => retryFailedUploads({ storageBucket, storagePath })}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить загрузку ({errorCount} файлов)
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Info - обновим информацию */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Загружено: {existingImages.length} / {maxImages} изображений</div>
        <div>📸 Изображения автоматически сжимаются до 400KB</div>
        {productId && autoGeneratePreview ? (
          <div>🖼️ Превью 20KB создаётся автоматически для каждого изображения</div>
        ) : (
          <div>🖼️ Превью создаётся автоматически после публикации товара</div>
        )}
        {isMobileDevice && (
          <div>💡 Совет: для экономии трафика изображения сжимаются автоматически</div>
        )}
      </div>
    </div>
  );
};
