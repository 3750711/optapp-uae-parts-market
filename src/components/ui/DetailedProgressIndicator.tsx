import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, Loader2, Wifi, WifiOff, Cloud, Server, Database } from 'lucide-react';

interface DetailedUploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  method?: string;
  error?: string;
  speed?: number; // bytes per second
}

interface DetailedProgressIndicatorProps {
  uploads: DetailedUploadItem[];
  onClear?: () => void;
  onRetry?: (id: string) => void;
}

const DetailedProgressIndicator: React.FC<DetailedProgressIndicatorProps> = ({
  uploads,
  onClear,
  onRetry
}) => {
  if (uploads.length === 0) return null;

  const completedUploads = uploads.filter(upload => 
    upload.status === 'success' || upload.status === 'error'
  );
  const isAllCompleted = completedUploads.length === uploads.length;

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'direct-cloudinary':
        return <Cloud className="h-3 w-3 text-blue-600" />;
      case 'edge-function':
        return <Server className="h-3 w-3 text-green-600" />;
      case 'supabase-storage':
        return <Database className="h-3 w-3 text-purple-600" />;
      default:
        return <Upload className="h-3 w-3 text-gray-400" />;
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'direct-cloudinary':
        return 'Прямая загрузка';
      case 'edge-function':
        return 'Через сервер';
      case 'supabase-storage':
        return 'Резервный путь';
      default:
        return 'Подготовка';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return '';
    if (speed > 1024 * 1024) return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
    if (speed > 1024) return `${(speed / 1024).toFixed(1)} KB/s`;
    return `${speed} B/s`;
  };

  const getEstimatedTime = (progress: number, speed?: number, fileSize?: number) => {
    if (!speed || !fileSize || progress >= 100) return '';
    const remaining = fileSize * (1 - progress / 100);
    const seconds = remaining / speed;
    if (seconds > 60) return `~${Math.ceil(seconds / 60)}м`;
    return `~${Math.ceil(seconds)}с`;
  };

  return (
    <div className="space-y-4 p-4 bg-background border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">
            Загрузка файлов ({completedUploads.length}/{uploads.length})
          </h4>
          {navigator.onLine ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </div>
        
        {isAllCompleted && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Очистить
          </button>
        )}
      </div>

      <div className="space-y-3">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-2 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(upload.status)}
                <span className="truncate text-sm font-medium" title={upload.fileName}>
                  {upload.fileName}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {upload.method && (
                  <div className="flex items-center gap-1">
                    {getMethodIcon(upload.method)}
                    <span className="text-xs text-muted-foreground">
                      {getMethodLabel(upload.method)}
                    </span>
                  </div>
                )}
                
                <Badge variant="outline" className="text-xs">
                  {upload.status === 'pending' && 'Ожидание'}
                  {upload.status === 'uploading' && 'Загрузка'}
                  {upload.status === 'processing' && 'Обработка'}
                  {upload.status === 'success' && 'Готово'}
                  {upload.status === 'error' && 'Ошибка'}
                </Badge>
              </div>
            </div>
            
            {upload.status !== 'success' && upload.status !== 'error' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{upload.progress}%</span>
                  <div className="flex items-center gap-2">
                    {upload.speed && (
                      <span>{formatSpeed(upload.speed)}</span>
                    )}
                  </div>
                </div>
                <Progress value={upload.progress} className="h-2" />
              </div>
            )}
            
            {upload.status === 'error' && upload.error && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-destructive flex-1">
                  {upload.error}
                </p>
                {onRetry && (
                  <button
                    onClick={() => onRetry(upload.id)}
                    className="text-xs text-primary hover:underline ml-2"
                  >
                    Повторить
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!navigator.onLine && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <WifiOff className="h-4 w-4" />
          <span>Нет подключения. Файлы будут загружены при восстановлении связи.</span>
        </div>
      )}
    </div>
  );
};

export default DetailedProgressIndicator;