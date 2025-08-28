import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useUnifiedImageUpload } from '@/hooks/useUnifiedImageUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CompressionResult } from '@/workers/types';

interface UnifiedImageUploadProps {
  onImagesUploaded?: (urls: string[]) => void;
  onProgress?: (progress: { completed: number; total: number; current?: string }) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  showDiagnostics?: boolean;
}

export const UnifiedImageUpload: React.FC<UnifiedImageUploadProps> = ({
  onImagesUploaded,
  onProgress,
  maxImages = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  showDiagnostics = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  
  const {
    uploadFiles,
    cancelUpload,
    clearCompleted,
    uploadQueue,
    isUploading,
    networkProfile,
    getDiagnostics,
    compressionMetrics,
    workerStats
  } = useUnifiedImageUpload();

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > maxFileSize) return false;
      return true;
    });

    if (validFiles.length === 0) return;

    // Respect max images limit
    const remainingSlots = maxImages - uploadQueue.filter(item => 
      ['success', 'pending', 'compressing', 'signing', 'uploading'].includes(item.status)
    ).length;
    
    const filesToUpload = validFiles.slice(0, remainingSlots);

    uploadFiles(filesToUpload, {
      onComplete: (urls) => {
        onImagesUploaded?.(urls);
        onProgress?.({ 
          completed: uploadQueue.filter(item => item.status === 'success').length,
          total: uploadQueue.length 
        });
      },
      onProgress: (items) => {
        const completed = items.filter(item => item.status === 'success').length;
        const current = items.find(item => 
          ['compressing', 'signing', 'uploading'].includes(item.status)
        )?.file.name;
        
        onProgress?.({ completed, total: items.length, current });
      }
    });
  }, [uploadFiles, onImagesUploaded, onProgress, maxImages, maxFileSize, uploadQueue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled || !e.dataTransfer.files) return;
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'compressing':
      case 'signing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  const getCompressionInfo = (result?: CompressionResult) => {
    if (!result) return null;
    
    const ratio = ((result.originalSize - result.compressedSize) / result.originalSize) * 100;
    return (
      <div className="text-xs text-muted-foreground">
        {Math.round(ratio)}% smaller • {result.method} • {result.compressionMs}ms
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`relative p-6 border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFileSelect(files);
            };
            input.click();
          }
        }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Images</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxImages} images • Up to {Math.round(maxFileSize / (1024 * 1024))}MB each
          </p>
        </div>
      </Card>

      {/* Network Status */}
      {networkProfile && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Network: {networkProfile.effectiveType} • 
            Speed: {Math.round(networkProfile.bytesPerSecond / 1024)}KB/s • 
            RTT: {networkProfile.rtt}ms
            {compressionMetrics.successfulCompressions > 0 && (
              <> • Avg compression: {Math.round(compressionMetrics.averageCompressionRatio * 100)}%</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Upload Progress</h4>
            <div className="flex gap-2">
              {isUploading && (
                <Button size="sm" variant="outline" onClick={cancelUpload}>
                  Cancel
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={clearCompleted}>
                Clear Completed
              </Button>
            </div>
          </div>

          {uploadQueue.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <div className="text-sm font-medium truncate max-w-[200px]">
                      {item.file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(item.file.size / 1024)}KB • {item.status}
                    </div>
                    {getCompressionInfo(item.compressionResult)}
                  </div>
                </div>
                {item.status === 'error' && item.error && (
                  <div className="text-xs text-destructive max-w-[200px] truncate">
                    {item.error}
                  </div>
                )}
              </div>
              
              {['compressing', 'signing', 'uploading'].includes(item.status) && (
                <Progress value={item.progress} className="w-full" />
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">System Diagnostics</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium">Worker Status</div>
              <div>Smart: {workerStats.smartAvailable ? '✅' : '❌'}</div>
              <div>Stable: {workerStats.stableAvailable ? '✅' : '❌'}</div>
              <div>Active: {workerStats.busyWorkers}/{workerStats.totalWorkers}</div>
            </div>
            <div>
              <div className="font-medium">Performance</div>
              <div>Success Rate: {Math.round((compressionMetrics.successfulCompressions / Math.max(compressionMetrics.totalFiles, 1)) * 100)}%</div>
              <div>Avg Time: {Math.round(compressionMetrics.averageCompressionTime)}ms</div>
              <div>Device: {workerStats.capabilities.isLowEndDevice ? 'Low-end' : 'Standard'}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};