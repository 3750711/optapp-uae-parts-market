// Enhanced UI component for Cloudinary upload progress visualization

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pause, 
  Play, 
  X, 
  Upload, 
  Archive, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Smartphone
} from 'lucide-react';
// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'success' | 'error' | 'deleted' | 'paused';
  error?: string;
  originalSize: number;
  compressedSize?: number;
  finalUrl?: string;
}

interface NetworkProfile {
  effectiveType: string;
  saveData: boolean;
  maxConcurrent: number;
  maxSide: number;
  quality: number;
}

interface CloudinaryUploadProgressProps {
  uploadQueue: UploadItem[];
  isUploading: boolean;
  isPaused: boolean;
  networkProfile: NetworkProfile;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRemoveItem?: (itemId: string) => void;
}

const getStatusIcon = (status: UploadItem['status']) => {
  switch (status) {
    case 'pending':
      return <Upload className="h-4 w-4 text-muted-foreground" />;
    case 'compressing':
      return <Archive className="h-4 w-4 text-blue-500 animate-pulse" />;
    case 'signing':
      return <Upload className="h-4 w-4 text-orange-500 animate-pulse" />;
    case 'uploading':
      return <Upload className="h-4 w-4 text-primary animate-pulse" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-yellow-500" />;
    default:
      return <Upload className="h-4 w-4" />;
  }
};

const getStatusText = (status: UploadItem['status']) => {
  switch (status) {
    case 'pending': return 'Ожидание';
    case 'compressing': return 'Сжатие';
    case 'signing': return 'Подпись';
    case 'uploading': return 'Загрузка';
    case 'success': return 'Завершено';
    case 'error': return 'Ошибка';
    case 'paused': return 'Пауза';
    default: return 'Неизвестно';
  }
};

const getNetworkIcon = (networkProfile: NetworkProfile) => {
  const { effectiveType, saveData } = networkProfile;
  
  if (saveData) {
    return <div title="Экономия данных"><Smartphone className="h-4 w-4 text-orange-500" /></div>;
  }
  
  switch (effectiveType) {
    case '4g':
      return <div title="4G сеть"><Wifi className="h-4 w-4 text-green-500" /></div>;
    case '3g':
      return <div title="3G сеть"><Wifi className="h-4 w-4 text-yellow-500" /></div>;
    case '2g':
    case 'slow-2g':
      return <div title="Медленная сеть"><WifiOff className="h-4 w-4 text-red-500" /></div>;
    default:
      return <Wifi className="h-4 w-4 text-muted-foreground" />;
  }
};

export const CloudinaryUploadProgress: React.FC<CloudinaryUploadProgressProps> = ({
  uploadQueue,
  isUploading,
  isPaused,
  networkProfile,
  onPause,
  onResume,
  onCancel,
  onRemoveItem
}) => {
  const activeUploads = uploadQueue.filter(item => 
    ['pending', 'compressing', 'signing', 'uploading'].includes(item.status)
  );
  
  const completedUploads = uploadQueue.filter(item => item.status === 'success');
  const failedUploads = uploadQueue.filter(item => item.status === 'error');
  const pausedUploads = uploadQueue.filter(item => item.status === 'paused');
  
  const totalProgress = uploadQueue.length > 0 
    ? Math.round(uploadQueue.reduce((sum, item) => sum + item.progress, 0) / uploadQueue.length)
    : 0;

  const totalOriginalSize = uploadQueue.reduce((sum, item) => sum + item.originalSize, 0);
  const totalCompressedSize = uploadQueue.reduce((sum, item) => sum + (item.compressedSize || item.originalSize), 0);
  const compressionSavings = totalOriginalSize > 0 
    ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
    : 0;

  if (uploadQueue.length === 0) return null;

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      {/* Header with network info and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getNetworkIcon(networkProfile)}
          <span className="text-sm font-medium">
            Прямая загрузка в Cloudinary
          </span>
          <Badge variant="outline" className="text-xs">
            {networkProfile.effectiveType?.toUpperCase() || '4G'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {activeUploads.length > 0 && !isPaused && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onPause}
            >
              <Pause className="h-3 w-3 mr-1" />
              Пауза
            </Button>
          )}
          
          {(isPaused || pausedUploads.length > 0) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onResume}
            >
              <Play className="h-3 w-3 mr-1" />
              Продолжить
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onCancel}
          >
            <X className="h-3 w-3 mr-1" />
            Отменить
          </Button>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Общий прогресс</span>
          <span className="font-mono">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>✅ {completedUploads.length}</span>
            {failedUploads.length > 0 && <span className="text-red-500">❌ {failedUploads.length}</span>}
            {pausedUploads.length > 0 && <span className="text-yellow-500">⏸️ {pausedUploads.length}</span>}
          </div>
          
          {compressionSavings > 0 && (
            <span className="text-green-600">
              Сжатие: -{compressionSavings}%
            </span>
          )}
        </div>
      </div>

      {/* Network profile info */}
      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground bg-muted/50 p-3 rounded">
        <div className="space-y-1">
          <div>📐 Макс. размер: {networkProfile.maxSide}px</div>
          <div>🎯 Качество: {Math.round(networkProfile.quality * 100)}%</div>
        </div>
        <div className="space-y-1">
          <div>🔄 Параллельно: {networkProfile.maxConcurrent}</div>
          <div>💾 Экономия: {networkProfile.saveData ? 'Да' : 'Нет'}</div>
        </div>
      </div>

      {/* Individual file progress */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {uploadQueue.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm"
          >
            {getStatusIcon(item.status)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate" title={item.file.name}>
                  {item.file.name}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <Badge 
                    variant={item.status === 'success' ? 'default' : 'secondary'}
                    className="text-xs px-1"
                  >
                    {getStatusText(item.status)}
                  </Badge>
                  {item.status !== 'pending' && (
                    <span className="font-mono">{item.progress}%</span>
                  )}
                </div>
              </div>
              
              {item.status !== 'pending' && (
                <Progress 
                  value={item.progress} 
                  className={`h-1 ${
                    item.status === 'error' ? 'bg-red-100' : ''
                  }`}
                />
              )}
              
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>
                  {formatBytes(item.originalSize)}
                  {item.compressedSize && item.compressedSize !== item.originalSize && (
                    <span className="text-green-600 ml-1">
                      → {formatBytes(item.compressedSize)}
                    </span>
                  )}
                </span>
                
                {item.error && (
                  <span className="text-red-500 truncate" title={item.error}>
                    {item.error}
                  </span>
                )}
              </div>
            </div>
            
            {onRemoveItem && ['error', 'success'].includes(item.status) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveItem(item.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Statistics summary */}
      {completedUploads.length > 0 && (
        <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
          📊 Статистика: Загружено {completedUploads.length} файлов, 
          {totalOriginalSize > 0 && (
            <> исходный размер {formatBytes(totalOriginalSize)}, 
            сжато до {formatBytes(totalCompressedSize)} (-{compressionSavings}%)</>
          )}
        </div>
      )}
    </div>
  );
};