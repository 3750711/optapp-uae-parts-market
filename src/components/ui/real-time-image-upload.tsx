
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, RotateCw, Camera } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  isImage, 
  preProcessImageForUpload, 
  batchUploadImages, 
  progressiveCompress 
} from "@/utils/imageCompression";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface RealtimeImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket?: string;
  storagePath?: string;
}

interface FileUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'processing' | 'uploading' | 'error' | 'complete';
  error?: string;
}

export const RealtimeImageUpload: React.FC<RealtimeImageUploadProps> = ({
  onUploadComplete,
  maxImages = 30,
  storageBucket = "product-images",
  storagePath = "temp"
}) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Constants - increased maximum size from 10MB to 25MB
  const MAX_FILE_SIZE_MB = 25;
  const TARGET_SIZE_MB = 5;
  const MAX_CONCURRENT_UPLOADS = 3;
  
  // Check if device is iOS
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }, []);

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const updateFileProgress = (fileId: string, updates: Partial<FileUploadProgress>) => {
    setFileProgress(prev => {
      const newMap = new Map(prev);
      const currentFile = newMap.get(fileId);
      if (currentFile) {
        newMap.set(fileId, { ...currentFile, ...updates });
      }
      return newMap;
    });
  };

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check for maximum images limit
    const totalCount = uploadedImages.length + files.length;
    if (totalCount > maxImages) {
      toast({
        title: "Ограничение на количество изображений",
        description: `Можно загрузить максимум ${maxImages} изображений`,
        variant: "destructive",
      });
      return;
    }
    
    // Create a new queue of valid files for processing
    const newQueue: File[] = [];
    const newProgressMap = new Map(fileProgress);
    
    // First validate all files and create entries for progress tracking
    for (const file of Array.from(files)) {
      if (!isImage(file)) {
        toast({
          title: "Неверный формат файла",
          description: `${file.name} не является изображением`,
          variant: "destructive",
        });
        continue;
      }
      
      const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to progress tracking with 'processing' status
      newProgressMap.set(fileId, {
        id: fileId,
        file,
        progress: 0,
        status: 'processing',
      });
      
      // Add to new queue
      newQueue.push(file);
    }
    
    // Update file progress state
    setFileProgress(newProgressMap);
    
    // Pre-process files before adding to upload queue
    const processedFiles: File[] = [];
    
    try {
      // Process each file individually
      for (const [fileId, fileData] of newProgressMap.entries()) {
        if (fileData.status !== 'processing') continue;
        
        try {
          // Pre-process image to compress if needed before size check
          const processedFile = await preProcessImageForUpload(
            fileData.file,
            MAX_FILE_SIZE_MB,
            TARGET_SIZE_MB
          );
          
          processedFiles.push(processedFile);
          updateFileProgress(fileId, { status: 'uploading', progress: 10 });
        } catch (error) {
          console.error(`Failed to process ${fileData.file.name}:`, error);
          updateFileProgress(fileId, { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          });
          
          toast({
            title: "Ошибка обработки",
            description: error instanceof Error 
              ? error.message 
              : `Не удалось обработать ${fileData.file.name}`,
            variant: "destructive",
          });
        }
      }
      
      // Add processed files to upload queue
      if (processedFiles.length > 0) {
        setUploadQueue(prev => [...prev, ...processedFiles]);
        
        // If not already uploading, start the process
        if (!uploading) {
          startUploadProcess([...uploadQueue, ...processedFiles]);
        }
      }
    } catch (error) {
      console.error("Error during file preprocessing:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подготовить файлы к загрузке",
        variant: "destructive",
      });
    }
  }, [uploadedImages.length, maxImages, uploadQueue, uploading, fileProgress]);
  
  const startUploadProcess = async (queue: File[]) => {
    if (queue.length === 0) return;
    
    setUploading(true);
    
    try {
      // Use batch upload with parallel processing
      const uploadedUrls = await batchUploadImages(
        queue,
        storageBucket,
        storagePath,
        (overallProgress) => {
          // Overall progress is handled by the batch upload
        },
        (fileIndex, progress) => {
          // Individual file progress
          const fileId = Array.from(fileProgress.keys())[fileIndex];
          if (fileId) {
            updateFileProgress(fileId, { progress: progress });
          }
        },
        MAX_CONCURRENT_UPLOADS
      );
      
      if (uploadedUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadedUrls]);
        onUploadComplete(uploadedUrls);
        
        // Mark all as complete
        const completeUpdates = new Map();
        Array.from(fileProgress.entries()).forEach(([id, data]) => {
          if (data.status === 'uploading') {
            completeUpdates.set(id, { ...data, status: 'complete', progress: 100 });
          }
        });
        
        setFileProgress(completeUpdates);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить некоторые файлы",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadQueue([]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      
      // After a delay, remove completed uploads from progress tracking
      setTimeout(() => {
        setFileProgress(prev => {
          const newMap = new Map();
          Array.from(prev.entries()).forEach(([id, data]) => {
            if (data.status !== 'complete') {
              newMap.set(id, data);
            }
          });
          return newMap;
        });
      }, 3000);
    }
  };
  
  const removeImage = useCallback((url: string) => {
    setUploadedImages(uploadedImages.filter(img => img !== url));
  }, [uploadedImages]);
  
  // Open gallery file dialog
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  // Open camera input dialog specifically for mobile devices
  const openCameraDialog = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  // Clean up any object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Here would be any cleanup code if we were using object URLs
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {uploadedImages.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border group">
            <img 
              src={url} 
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            {index === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                <p className="text-white text-xs text-center">Главное фото</p>
              </div>
            )}
          </div>
        ))}
        
        {/* Display files that are currently processing or uploading */}
        {Array.from(fileProgress.values()).map((file) => (
          <div key={file.id} className="relative aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center p-2">
            {file.status === 'processing' && (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 text-center">Обработка</span>
              </>
            )}
            
            {file.status === 'uploading' && (
              <>
                <div className="mb-2 w-8 h-8 relative flex items-center justify-center">
                  {file.progress < 100 ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <Progress value={file.progress} className="h-1.5 w-full mb-1" />
                <span className="text-xs text-gray-500">{file.progress}%</span>
              </>
            )}
            
            {file.status === 'error' && (
              <>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-xs text-red-500 text-center">Ошибка: {file.error}</span>
              </>
            )}
          </div>
        ))}
        
        {uploadedImages.length + fileProgress.size < maxImages && (
          <div 
            onClick={openFileDialog}
            className={cn(
              "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="text-3xl text-gray-300">+</div>
            <p className="text-sm text-gray-500">Добавить фото</p>
          </div>
        )}
      </div>
      
      {/* File inputs separated for gallery and camera */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={uploading}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={uploading}
      />
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex items-center gap-2 flex-1"
          onClick={openFileDialog}
          disabled={uploading || uploadedImages.length >= maxImages}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              Галерея
            </>
          )}
        </Button>
        
        {isMobile() && (
          <Button 
            type="button" 
            variant="outline" 
            className="flex items-center gap-2 flex-1"
            onClick={openCameraDialog}
            disabled={uploading || uploadedImages.length >= maxImages}
          >
            <Camera className="h-4 w-4" />
            Камера
          </Button>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Загрузка происходит сразу после выбора изображений. Максимум {maxImages} изображений. 
        Первое изображение будет главным. Поддерживаются файлы до {MAX_FILE_SIZE_MB} МБ.
      </p>
    </div>
  );
};

