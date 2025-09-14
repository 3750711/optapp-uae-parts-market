import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VideoUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
  error?: string;
  url?: string;
  chunks?: ChunkStatus[];
}

interface ChunkStatus {
  index: number;
  uploaded: boolean;
  size: number;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_RETRIES = 3;

export const useSimpleChunkedVideoUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const pausedUploads = useRef<Map<string, { file: File, uploadedChunks: number[] }>>(new Map());

  // Разбить файл на чанки
  const createChunks = (file: File): ChunkStatus[] => {
    const chunks: ChunkStatus[] = [];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        index: i,
        uploaded: false,
        size: end - start
      });
    }
    
    return chunks;
  };

  // Загрузка одного чанка
  const uploadChunk = async (
    file: File,
    chunkIndex: number,
    totalChunks: number,
    fileId: string,
    signal?: AbortSignal
  ): Promise<boolean> => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    // Создаем FormData для чанка
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size.toString());
    formData.append('isLastChunk', (chunkIndex === totalChunks - 1).toString());
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks}`);
        
        const { data, error } = await supabase.functions.invoke('cloudinary-video-upload', {
          body: formData,
          signal
        });

        if (error) throw error;
        
        if (data?.success) {
          // Обновляем прогресс
          setUploadProgress(prev => prev.map(p => {
            if (p.fileId === fileId) {
              const updatedChunks = [...(p.chunks || [])];
              updatedChunks[chunkIndex].uploaded = true;
              const uploadedCount = updatedChunks.filter(c => c.uploaded).length;
              
              return {
                ...p,
                chunks: updatedChunks,
                progress: Math.round((uploadedCount / totalChunks) * 100),
                url: data.cloudinaryUrl || p.url, // URL приходит с последним чанком
                status: uploadedCount === totalChunks ? 'success' : 'uploading'
              };
            }
            return p;
          }));
          
          return true;
        }
        
        throw new Error(data?.error || 'Chunk upload failed');
        
      } catch (error: any) {
        console.error(`❌ Chunk ${chunkIndex + 1} attempt ${attempt + 1} failed:`, error);
        
        if (signal?.aborted) {
          throw new Error('Upload cancelled');
        }
        
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        
        // Экспоненциальная задержка
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return false;
  };

  // Основная функция загрузки
  const uploadVideo = useCallback(async (file: File): Promise<string | null> => {
    const fileId = `${file.name}-${Date.now()}`;
    const chunks = createChunks(file);
    
    // Проверяем, есть ли сохраненный прогресс
    const pausedUpload = pausedUploads.current.get(fileId);
    const startFromChunk = pausedUpload ? 
      Math.max(...pausedUpload.uploadedChunks) + 1 : 0;
    
    // Создаем контроллер для отмены
    const abortController = new AbortController();
    abortControllers.current.set(fileId, abortController);
    
    // Инициализируем прогресс
    setUploadProgress(prev => [...prev, {
      fileId,
      fileName: file.name,
      progress: pausedUpload ? 
        Math.round((pausedUpload.uploadedChunks.length / chunks.length) * 100) : 0,
      status: 'uploading',
      chunks
    }]);
    
    try {
      setIsUploading(true);
      
      // Загружаем чанки последовательно
      for (let i = startFromChunk; i < chunks.length; i++) {
        const success = await uploadChunk(
          file, 
          i, 
          chunks.length, 
          fileId,
          abortController.signal
        );
        
        if (!success) {
          throw new Error(`Failed to upload chunk ${i + 1}`);
        }
        
        // Сохраняем прогресс для возможности возобновления
        const uploadedChunks = pausedUpload?.uploadedChunks || [];
        uploadedChunks.push(i);
        pausedUploads.current.set(fileId, { file, uploadedChunks });
      }
      
      // Получаем финальный URL
      const finalProgress = uploadProgress.find(p => p.fileId === fileId);
      if (finalProgress?.url) {
        // Очищаем сохраненный прогресс
        pausedUploads.current.delete(fileId);
        abortControllers.current.delete(fileId);
        
        toast({
          title: "Видео загружено",
          description: `${file.name} успешно загружен`
        });
        
        return finalProgress.url;
      }
      
      throw new Error('No URL received after upload');
      
    } catch (error: any) {
      if (error.message === 'Upload cancelled') {
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId ? { ...p, status: 'paused' } : p
        ));
      } else {
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId ? { ...p, status: 'error', error: error.message } : p
        ));
        
        toast({
          title: "Ошибка загрузки",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadProgress]);

  // Пауза загрузки
  const pauseUpload = useCallback((fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      console.log('⏸️ Upload paused:', fileId);
    }
  }, []);

  // Возобновление загрузки
  const resumeUpload = useCallback(async (fileId: string) => {
    const pausedUpload = pausedUploads.current.get(fileId);
    if (pausedUpload) {
      console.log('▶️ Resuming upload:', fileId);
      await uploadVideo(pausedUpload.file);
    }
  }, [uploadVideo]);

  // Загрузка нескольких файлов
  const uploadMultipleVideos = useCallback(async (
    files: File[]
  ): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const url = await uploadVideo(file);
      if (url) {
        urls.push(url);
      }
    }
    
    return urls;
  }, [uploadVideo]);

  // Очистка прогресса
  const clearProgress = useCallback(() => {
    setUploadProgress([]);
    abortControllers.current.clear();
    pausedUploads.current.clear();
  }, []);

  return {
    uploadVideo,
    uploadMultipleVideos,
    pauseUpload,
    resumeUpload,
    isUploading,
    uploadProgress,
    clearProgress
  };
};