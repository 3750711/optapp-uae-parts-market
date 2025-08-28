import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Zap, Clock, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOptimizedCloudinaryUpload } from '@/hooks/useOptimizedCloudinaryUpload';
import { Badge } from '@/components/ui/badge';

interface OptimizedStagedImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const OptimizedStagedImageUpload: React.FC<OptimizedStagedImageUploadProps> = ({
  onImagesChange,
  maxImages = 10,
  disabled = false
}) => {
  const {
    stagedUrls,
    uploadItems,
    isUploading,
    networkProfile,
    uploadFiles,
    removeStagedUrl,
    getPerformanceSummary
  } = useOptimizedCloudinaryUpload();

  // Notify parent when staged URLs change
  useEffect(() => {
    onImagesChange(stagedUrls);
  }, [stagedUrls, onImagesChange]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    // Check limits
    const totalImages = stagedUrls.length + imageFiles.length;
    if (totalImages > maxImages) {
      const allowedCount = maxImages - stagedUrls.length;
      if (allowedCount <= 0) {
        alert(`Максимум ${maxImages} изображений разрешено`);
        return;
      }
      
      alert(`Можно загрузить только ${allowedCount} изображений из ${imageFiles.length} выбранных`);
      imageFiles.splice(allowedCount);
    }
    
    await uploadFiles(imageFiles);
    
    // Clear input
    event.target.value = '';
  }, [stagedUrls.length, maxImages, uploadFiles]);

  const handleRemoveImage = useCallback((url: string) => {
    removeStagedUrl(url);
    onImagesChange(stagedUrls.filter(u => u !== url));
  }, [removeStagedUrl, stagedUrls, onImagesChange]);

  const performanceSummary = getPerformanceSummary();

  const getNetworkBadgeColor = (type: string) => {
    switch (type) {
      case '3g': return 'destructive';
      case '4g': return 'default';
      case 'wifi': return 'secondary';
      default: return 'outline';
    }
  };

  const formatSpeed = (bytesPerSec: number) => {
    return `${Math.round(bytesPerSec / 1024)}KB/s`;
  };

  return (
    <div className="space-y-4">
      {/* Network Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>Сеть:</span>
        <Badge variant={getNetworkBadgeColor(networkProfile.type)}>
          {networkProfile.type.toUpperCase()}
        </Badge>
        <span>•</span>
        <span>{formatSpeed(networkProfile.bytesPerSecond)}</span>
        {performanceSummary && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{Math.round(performanceSummary.avgUploadTime / 1000)}s/файл
            </span>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {uploadItems.length > 0 && (
        <div className="space-y-2">
          {uploadItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px]">{item.file.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.status === 'compressing' && <span>Сжатие...</span>}
                  {item.status === 'signing' && <span>Подпись...</span>}
                  {item.status === 'uploading' && <span>Загрузка...</span>}
                  {item.status === 'success' && item.metrics && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round((1 - item.metrics.compressedBytes! / item.metrics.originalBytes!) * 100)}% сжатие
                    </span>
                  )}
                  {item.status === 'error' && <span className="text-destructive">Ошибка</span>}
                </div>
              </div>
              <Progress value={item.progress} />
              {item.error && (
                <p className="text-xs text-destructive">{item.error}</p>
              )}
              {item.metrics && item.status === 'success' && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(item.metrics.originalBytes! / 1024)}KB → {Math.round(item.metrics.compressedBytes! / 1024)}KB 
                  • {Math.round(item.metrics.uploadMs! / 1000)}s 
                  • {formatSpeed(item.metrics.bytesPerSec!)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {stagedUrls.length < maxImages && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Оптимизированная загрузка изображений</p>
              <p className="text-xs text-muted-foreground">
                Адаптивное сжатие • Параллельная обработка • ~8-10с/файл
              </p>
            </div>
            <Button
              variant="outline"
              disabled={disabled || isUploading}
              onClick={() => document.getElementById('optimized-image-upload')?.click()}
            >
              {isUploading ? 'Загрузка...' : 'Выбрать изображения'}
            </Button>
            <input
              id="optimized-image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <p className="text-xs text-muted-foreground">
              До {maxImages - stagedUrls.length} изображений, макс. 10MB каждое
            </p>
          </div>
        </div>
      )}

      {/* Images Gallery */}
      {stagedUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stagedUrls.map((url, index) => (
            <div key={url} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={url}
                  alt={`Загруженное изображение ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Info Alert */}
      {stagedUrls.length > 0 && (
        <Alert>
          <AlertDescription>
            Изображения временно сохранены и будут прикреплены к заказу после его создания.
            {performanceSummary && (
              <span className="block mt-1 text-xs">
                Статистика: {performanceSummary.totalFiles} файлов, 
                среднее сжатие {performanceSummary.avgCompressionRatio}%, 
                средняя скорость {performanceSummary.avgSpeed}KB/s
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};