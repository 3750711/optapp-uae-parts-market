
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressItem {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  fileSize?: number;
}

interface UploadProgressDisplayProps {
  uploadProgress: UploadProgressItem[];
  onCancel?: (fileId: string) => void;
  onCancelAll?: () => void;
  className?: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Upload className="h-4 w-4 text-gray-400" />;
    case 'uploading':
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Upload className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusText = (status: string, progress: number): string => {
  switch (status) {
    case 'pending':
      return 'Ожидание';
    case 'uploading':
      return `Загрузка ${progress}%`;
    case 'processing':
      return 'Обработка';
    case 'success':
      return 'Завершено';
    case 'error':
      return 'Ошибка';
    default:
      return 'Неизвестно';
  }
};

export const UploadProgressDisplay: React.FC<UploadProgressDisplayProps> = ({
  uploadProgress,
  onCancel,
  onCancelAll,
  className
}) => {
  if (uploadProgress.length === 0) return null;

  const inProgress = uploadProgress.some(p => p.status === 'uploading' || p.status === 'processing' || p.status === 'pending');
  const hasErrors = uploadProgress.some(p => p.status === 'error');
  const completedCount = uploadProgress.filter(p => p.status === 'success').length;
  const totalCount = uploadProgress.length;

  return (
    <div className={cn("space-y-3 p-4 bg-gray-50 rounded-lg border", className)}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Загрузка фотографий ({completedCount}/{totalCount})
        </div>
        {inProgress && onCancelAll && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelAll}
            className="h-7 px-2 text-xs"
          >
            Отменить все
          </Button>
        )}
      </div>

      {/* Список файлов */}
      <div className="space-y-2">
        {uploadProgress.map((item) => (
          <div key={item.fileId} className="bg-white rounded-md p-3 border">
            <div className="flex items-center gap-3">
              {/* Иконка статуса */}
              <div className="flex-shrink-0">
                {getStatusIcon(item.status)}
              </div>

              {/* Информация о файле */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(item.fileSize)}
                  </div>
                </div>

                {/* Прогресс бар */}
                <div className="space-y-1">
                  <Progress 
                    value={item.progress} 
                    className={cn(
                      "h-2",
                      item.status === 'error' && "bg-red-100",
                      item.status === 'success' && "bg-green-100"
                    )}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      "text-gray-600",
                      item.status === 'error' && "text-red-600",
                      item.status === 'success' && "text-green-600"
                    )}>
                      {getStatusText(item.status, item.progress)}
                    </span>
                    {item.status === 'success' && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </div>

                {/* Сообщение об ошибке */}
                {item.error && (
                  <div className="mt-1 text-xs text-red-600 truncate">
                    {item.error}
                  </div>
                )}
              </div>

              {/* Кнопка отмены */}
              {onCancel && (item.status === 'pending' || item.status === 'uploading') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(item.fileId)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Сводка */}
      {hasErrors && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          Некоторые файлы не удалось загрузить. Попробуйте еще раз.
        </div>
      )}
    </div>
  );
};
