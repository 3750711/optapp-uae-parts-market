
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Cloud,
  X
} from "lucide-react";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  isPrimary?: boolean;
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
  onClearProgress
}) => {
  // Simple clear handler without useCallback to prevent dependency issues
  const handleClearProgress = () => {
    console.log('🗑️ Force clearing upload progress - button clicked');
    onClearProgress();
  };

  // Auto-hide after successful uploads with simplified logic
  useEffect(() => {
    if (uploadProgress.length === 0 || isUploading) {
      console.log('⏭️ Skipping auto-clear: no progress or still uploading', {
        progressLength: uploadProgress.length,
        isUploading
      });
      return;
    }

    // Simple success condition check
    const successfulFiles = uploadProgress.filter(p => p.status === 'success');
    const hasSuccessfulUploads = successfulFiles.length > 0;
    const allCompleted = uploadProgress.every(p => p.status === 'success' || p.status === 'error');
    
    console.log('📊 Upload progress auto-clear check:', {
      totalFiles: uploadProgress.length,
      successfulFiles: successfulFiles.length,
      hasSuccessfulUploads,
      allCompleted,
      isUploading
    });

    // Auto-clear only if all uploads are completed and at least one was successful
    if (allCompleted && hasSuccessfulUploads) {
      console.log('⏰ Setting auto-clear timer for 2 seconds');
      const timer = setTimeout(() => {
        console.log('✨ Auto-clearing upload progress after successful uploads');
        onClearProgress();
      }, 2000);
      
      return () => {
        console.log('🚫 Clearing auto-clear timer');
        clearTimeout(timer);
      };
    }
  }, [uploadProgress, isUploading, onClearProgress]);

  if (uploadProgress.length === 0) return null;

  // Calculate overall progress
  const overallProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length
    : 0;

  const successCount = uploadProgress.filter(p => p.status === 'success').length;
  const errorCount = uploadProgress.filter(p => p.status === 'error').length;
  const uploadingCount = uploadProgress.filter(p => p.status === 'uploading').length;

  return (
    <Card className="bg-slate-50 border-slate-200 relative">
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Загрузка в Cloudinary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
              {/* Force close button - always visible with high z-index */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearProgress}
                className="h-6 w-6 p-0 hover:bg-red-100 relative z-10"
                title="Закрыть"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Status Summary */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            {uploadingCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                {uploadingCount} загружается
              </Badge>
            )}
            {successCount > 0 && (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500 px-2 py-1">
                <CheckCircle className="h-3 w-3" />
                {successCount} готово
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 px-2 py-1">
                <XCircle className="h-3 w-3" />
                {errorCount} ошибок
              </Badge>
            )}
          </div>

          {/* Clear Progress Button - only show when not uploading */}
          {!isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearProgress}
              className="h-8 px-2 text-xs relative z-10"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Очистить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
