
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CloudinaryVideoUploadResult {
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
  bitRate?: number;
  frameRate?: number;
  error?: string;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  duration?: number;
  thumbnailUrl?: string;
  xhr?: XMLHttpRequest;
}

export const useCloudinaryVideoUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const activeUploads = useRef<Map<string, XMLHttpRequest>>(new Map());

  const uploadVideo = async (
    file: File,
    productId?: string,
    customPublicId?: string
  ): Promise<CloudinaryVideoUploadResult> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('📤 Starting video upload with XMLHttpRequest:', {
          fileName: file.name,
          fileSize: file.size,
          productId
        });

        // Add to progress tracking
        const progressItem: UploadProgress = {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'pending'
        };
        
        setUploadProgress(prev => [...prev, progressItem]);

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        if (productId) {
          formData.append('productId', productId);
        }
        if (customPublicId) {
          formData.append('customPublicId', customPublicId);
        }

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        activeUploads.current.set(fileId, xhr);

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`📊 Upload progress: ${percentComplete}%`);
            
            setUploadProgress(prev => 
              prev.map(p => p.fileId === fileId 
                ? { ...p, progress: percentComplete, status: 'uploading' } 
                : p
              )
            );
          }
        };

        // Handle completion
        xhr.onload = async () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              
              if (data?.success) {
                console.log('✅ Upload successful:', data);
                
                setUploadProgress(prev => 
                  prev.map(p => p.fileId === fileId 
                    ? { 
                        ...p, 
                        status: 'success', 
                        progress: 100,
                        cloudinaryUrl: data.cloudinaryUrl,
                        publicId: data.publicId,
                        duration: data.duration,
                        thumbnailUrl: data.thumbnailUrl
                      } 
                    : p
                  )
                );
                
                resolve({
                  success: true,
                  cloudinaryUrl: data.cloudinaryUrl,
                  publicId: data.publicId,
                  thumbnailUrl: data.thumbnailUrl,
                  originalSize: data.originalSize,
                  compressedSize: data.compressedSize,
                  format: data.format,
                  duration: data.duration,
                  width: data.width,
                  height: data.height,
                  bitRate: data.bitRate,
                  frameRate: data.frameRate
                });
              } else {
                throw new Error(data?.error || 'Upload failed');
              }
            } else {
              throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            }
          } catch (error) {
            console.error('❌ Upload error:', error);
            setUploadProgress(prev => 
              prev.map(p => p.fileId === fileId 
                ? { ...p, status: 'error', error: error.message } 
                : p
              )
            );
            reject(error);
          } finally {
            activeUploads.current.delete(fileId);
          }
        };

        // Handle errors
        xhr.onerror = () => {
          const error = new Error('Network error occurred');
          console.error('❌ Network error');
          setUploadProgress(prev => 
            prev.map(p => p.fileId === fileId 
              ? { ...p, status: 'error', error: 'Network error' } 
              : p
            )
          );
          activeUploads.current.delete(fileId);
          reject(error);
        };

        // Handle abort
        xhr.onabort = () => {
          console.log('⏸️ Upload paused');
          setUploadProgress(prev => 
            prev.map(p => p.fileId === fileId 
              ? { ...p, status: 'paused' } 
              : p
            )
          );
          activeUploads.current.delete(fileId);
        };

        // Get the upload URL from Supabase
        const getUploadUrl = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No session found');
          }

          // Send request
          xhr.open('POST', `${supabase.supabaseUrl}/functions/v1/cloudinary-video-upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.send(formData);

          // Update status to uploading
          setUploadProgress(prev => 
            prev.map(p => p.fileId === fileId 
              ? { ...p, status: 'uploading' } 
              : p
            )
          );
        };

        getUploadUrl().catch(reject);

      } catch (error) {
        console.error('💥 Exception in uploadVideo:', error);
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId 
            ? { ...p, status: 'error', error: error.message } 
            : p
          )
        );
        reject(error);
      }
    });
  };

  const pauseUpload = (fileId: string) => {
    const xhr = activeUploads.current.get(fileId);
    if (xhr) {
      xhr.abort();
      console.log('⏸️ Paused upload:', fileId);
    }
  };

  const resumeUpload = async (fileId: string) => {
    // Find the paused upload
    const pausedUpload = uploadProgress.find(p => p.fileId === fileId && p.status === 'paused');
    if (pausedUpload) {
      // In a real implementation, you would need to store the file reference
      // For now, show a message to re-select the file
      toast({
        title: "Возобновление загрузки",
        description: "Пожалуйста, выберите файл заново для продолжения загрузки",
      });
    }
  };

  const uploadMultipleVideos = async (
    files: File[],
    productId?: string
  ): Promise<string[]> => {
    console.log('🎬 Starting multiple video upload:', { fileCount: files.length });
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const result = await uploadVideo(file, productId);
        if (result.success && result.cloudinaryUrl) {
          uploadedUrls.push(result.cloudinaryUrl);
        } else {
          toast({
            title: "Ошибка загрузки видео",
            description: `Не удалось загрузить ${file.name}: ${result.error}`,
            variant: "destructive",
          });
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Видео загружены",
          description: `Успешно загружено ${uploadedUrls.length} видео через Cloudinary`,
        });
      }

      console.log('🎉 Multiple video upload completed:', {
        totalFiles: files.length,
        successfulUploads: uploadedUrls.length
      });

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading multiple videos:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке видео",
        variant: "destructive",
      });
      return [];
    } finally {
      console.log('🏁 Setting isUploading to false');
      setIsUploading(false);
    }
  };

  const clearProgress = () => {
    console.log('🧹 Clearing upload progress');
    setUploadProgress([]);
    activeUploads.current.clear();
  };

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
