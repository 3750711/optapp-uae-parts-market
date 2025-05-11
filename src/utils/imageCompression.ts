
/**
 * Utility functions for image and video compression
 */

/**
 * Compresses an image to the specified dimensions while maintaining aspect ratio
 * @param file The image file to compress
 * @param maxWidth Maximum width of the compressed image
 * @param maxHeight Maximum height of the compressed image
 * @param quality Quality of the compressed image (0-1)
 * @returns Promise resolving to a compressed File object
 */
export const compressImage = async (
  file: File,
  maxWidth = 1024,
  maxHeight = 768,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed image data
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob'));
              return;
            }
            
            // Create new File from blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
};

/**
 * Uploads an image to Supabase storage in real-time
 * @param file The image file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to the uploaded file's public URL
 */
export const uploadImageRealtime = async (
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // First compress the image
  const compressedFile = await compressImage(file);
  
  // Create a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  
  // Import supabase client dynamically to avoid circular dependencies
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Create upload options
  const options: {
    cacheControl: string;
    contentType: string;
    upsert: boolean;
    onUploadProgress?: (progress: { loadedBytes: number; totalBytes: number }) => void;
  } = {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  };
  
  // Add progress callback if provided
  if (onProgress) {
    options.onUploadProgress = ({ loadedBytes, totalBytes }) => {
      const progressPercentage = Math.round((loadedBytes / totalBytes) * 100);
      onProgress(progressPercentage);
    };
  }
  
  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressedFile, options);
    
  if (error) {
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return publicUrl;
};

/**
 * Checks if a file is an image
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if a file is a video
 * @param file The file to check
 * @returns Boolean indicating if the file is a video
 */
export const isVideo = (file: File): boolean => {
  return file.type.startsWith('video/');
};
