import React, { useCallback, useRef } from 'react';
import { useSimpleChunkedVideoUpload } from '@/hooks/useSimpleChunkedVideoUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, Upload, X, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleChunkedVideoUploadProps {
  videos: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxVideos?: number;
  className?: string;
  disabled?: boolean;
}

export const SimpleChunkedVideoUpload: React.FC<SimpleChunkedVideoUploadProps> = ({
  videos,
  onUpload,
  onDelete,
  maxVideos = 3,
  className,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadMultipleVideos,
    pauseUpload,
    resumeUpload,
    isUploading,
    uploadProgress,
    clearProgress
  } = useSimpleChunkedVideoUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const files = Array.from(e.target.files);
    const urls = await uploadMultipleVideos(files);
    
    if (urls.length > 0) {
      onUpload(urls);
      clearProgress();
    }
    
    e.target.value = '';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing videos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
            <button
              onClick={() => onDelete(url)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
              disabled={disabled}
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        ))}
        
        {videos.length < maxVideos && (
          <div className="border-2 border-dashed rounded-lg aspect-video flex items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Upload className="h-6 w-6 mr-2" />
              Добавить видео
            </Button>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((progress) => (
            <Card key={progress.fileId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">
                    {progress.fileName}
                  </span>
                  <div className="flex items-center gap-2">
                    {progress.status === 'uploading' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => pauseUpload(progress.fileId)}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {progress.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resumeUpload(progress.fileId)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {progress.status === 'error' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resumeUpload(progress.fileId)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Progress value={progress.progress} className="h-2" />
                
                {progress.chunks && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Чанки: {progress.chunks.filter(c => c.uploaded).length}/{progress.chunks.length}
                  </div>
                )}
                
                {progress.error && (
                  <div className="text-xs text-red-500 mt-1">
                    {progress.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
