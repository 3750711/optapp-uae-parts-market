
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle, 
  Trash2, 
  Star, 
  Cloud 
} from "lucide-react";

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

interface UploadProgressCardProps {
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  onClearProgress: () => void;
  formatFileSize: (bytes: number) => string;
}

export const UploadProgressCard: React.FC<UploadProgressCardProps> = ({
  uploadProgress,
  isUploading,
  onClearProgress,
  formatFileSize
}) => {
  if (uploadProgress.length === 0) return null;

  // Calculate overall progress
  const overallProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length
    : 0;

  const successCount = uploadProgress.filter(p => p.status === 'success').length;
  const errorCount = uploadProgress.filter(p => p.status === 'error').length;
  const uploadingCount = uploadProgress.filter(p => p.status === 'uploading' || p.status === 'processing').length;

  return (
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
            onClick={onClearProgress}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Очистить прогресс
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
