
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error' | 'retrying';
  error?: string;
  attempt?: number;
  maxRetries?: number;
}

interface UploadProgressIndicatorProps {
  uploads: UploadItem[];
  onClear?: () => void;
}

const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  uploads,
  onClear
}) => {
  if (uploads.length === 0) return null;

  const completedUploads = uploads.filter(upload => 
    upload.status === 'success' || upload.status === 'error'
  );
  const isAllCompleted = completedUploads.length === uploads.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'retrying':
        return <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'uploading':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'retrying':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">
          Загрузка файлов ({completedUploads.length}/{uploads.length})
        </h4>
        {isAllCompleted && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Очистить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(upload.status)}
                <span className="truncate" title={upload.file.name}>
                  {upload.file.name}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(upload.status)}`}
                >
                  {upload.status === 'pending' && 'Ожидание'}
                  {upload.status === 'uploading' && 'Загрузка'}
                  {upload.status === 'processing' && 'Обработка'}
                  {upload.status === 'success' && 'Готово'}
                  {upload.status === 'error' && 'Ошибка'}
                  {upload.status === 'retrying' && `Повтор ${upload.attempt}/${upload.maxRetries}`}
                </Badge>
              </div>
              <span className="text-gray-500">
                {upload.progress}%
              </span>
            </div>
            
            {upload.status !== 'success' && upload.status !== 'error' && (
              <Progress value={upload.progress} className="h-1" />
            )}
            
            {(upload.status === 'error' || upload.status === 'retrying') && upload.error && (
              <p className="text-xs text-red-600 mt-1">
                {upload.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadProgressIndicator;
