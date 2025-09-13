import React, { useCallback, useRef } from 'react';
import { useChunkedCloudinaryVideoUpload, ChunkedUploadItem, UploadedVideo } from '@/hooks/useChunkedCloudinaryVideoUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  Video, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChunkedVideoUploaderProps {
  orderId: string;
  onUploaded: (videos: UploadedVideo[]) => void;
  maxVideos?: number;
  disabled?: boolean;
  className?: string;
}

const ChunkedVideoUploader: React.FC<ChunkedVideoUploaderProps> = ({
  orderId,
  onUploaded,
  maxVideos = 3,
  disabled = false,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const {
    uploads,
    isInitialized,
    addFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    getCompletedVideos
  } = useChunkedCloudinaryVideoUpload(orderId);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;
    
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('video/')
    );
    
    if (fileArray.length > 0) {
      addFiles(fileArray);
    }
  }, [addFiles, disabled]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Notify parent when videos are completed
  React.useEffect(() => {
    const completedVideos = getCompletedVideos();
    if (completedVideos.length > 0) {
      onUploaded(completedVideos);
    }
  }, [uploads, getCompletedVideos, onUploaded]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond?: number): string => {
    if (!bytesPerSecond) return '';
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  // Format ETA
  const formatETA = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '';
    if (seconds < 60) return `~${Math.ceil(seconds)}с`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}м`;
    return `~${Math.ceil(seconds / 3600)}ч`;
  };

  // Get status icon
  const getStatusIcon = (upload: ChunkedUploadItem) => {
    switch (upload.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <Video className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Video className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (upload: ChunkedUploadItem) => {
    const statusConfig = {
      idle: { label: 'Ожидание', variant: 'outline' as const },
      uploading: { label: 'Загрузка', variant: 'default' as const },
      paused: { label: 'Пауза', variant: 'secondary' as const },
      success: { label: 'Готово', variant: 'default' as const },
      error: { label: 'Ошибка', variant: 'destructive' as const },
      cancelled: { label: 'Отменено', variant: 'outline' as const }
    };

    const config = statusConfig[upload.status];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // Render upload controls
  const renderControls = (upload: ChunkedUploadItem) => {
    switch (upload.status) {
      case 'idle':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startUpload(upload.id)}
            className="h-8 px-3"
          >
            <Play className="h-3 w-3 mr-1" />
            Начать
          </Button>
        );
      
      case 'uploading':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => pauseUpload(upload.id)}
            className="h-8 px-3"
          >
            <Pause className="h-3 w-3 mr-1" />
            Пауза
          </Button>
        );
      
      case 'paused':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => resumeUpload(upload.id)}
              className="h-8 px-3"
            >
              <Play className="h-3 w-3 mr-1" />
              Продолжить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelUpload(upload.id)}
              className="h-8 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryUpload(upload.id)}
              className="h-8 px-3"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Повторить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelUpload(upload.id)}
              className="h-8 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      
      case 'success':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cancelUpload(upload.id)}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        );
      
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canAddMore = uploads.length < maxVideos;
  const hasActiveUploads = uploads.some(u => ['uploading', 'paused'].includes(u.status));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      {canAddMore && (
        <Card 
          ref={dropZoneRef}
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            disabled ? "border-muted cursor-not-allowed" : "border-muted-foreground hover:border-primary",
            "relative"
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Загрузить видео
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground">
              Поддерживаются: MP4, MOV, WebM • Максимум {maxVideos} файла • До 1GB каждый
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {navigator.onLine ? (
          <>
            <Wifi className="h-3 w-3 text-green-600" />
            <span>Подключение активно</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-600" />
            <span>Нет подключения</span>
          </>
        )}
        {hasActiveUploads && (
          <>
            <span>•</span>
            <Clock className="h-3 w-3" />
            <span>Загрузка в процессе</span>
          </>
        )}
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <Card key={upload.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(upload)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate" title={upload.file.name}>
                        {upload.file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(upload)}
                    {renderControls(upload)}
                  </div>
                </div>

                {/* Progress Section */}
                {(upload.status === 'uploading' || upload.status === 'paused') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{upload.progress}%</span>
                      <div className="flex items-center gap-2">
                        {upload.uploadSpeed && (
                          <span>{formatSpeed(upload.uploadSpeed)}</span>
                        )}
                        {upload.eta && (
                          <span>{formatETA(upload.eta)}</span>
                        )}
                      </div>
                    </div>
                    <Progress value={upload.progress} className="h-2" />
                    
                    {/* Chunk Progress */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Чанки:</span>
                      <span className="text-green-600">
                        {upload.chunks.filter(c => c.status === 'completed').length}
                      </span>
                      <span>/</span>
                      <span>{upload.chunks.length}</span>
                      {upload.chunks.some(c => c.retryCount > 0) && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-600">
                            {upload.chunks.filter(c => c.retryCount > 0).length} повторных
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {upload.status === 'error' && upload.error && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    {upload.error}
                  </div>
                )}

                {/* Success Info */}
                {upload.status === 'success' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    ✅ Видео успешно загружено и готово к использованию
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offline Warning */}
      {!navigator.onLine && hasActiveUploads && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span>
                Нет подключения к интернету. Загрузка продолжится автоматически при восстановлении связи.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChunkedVideoUploader;