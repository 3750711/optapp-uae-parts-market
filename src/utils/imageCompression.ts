/**
 * Utility functions for image and video compression
 */

/**
 * Compresses an image to the specified dimensions while maintaining aspect ratio
 * @param file The image file to compress
 * @param maxWidth Maximum width of the compressed image
 * @param maxHeight Maximum height of the compressed image
 * @param quality Quality of the compressed image (0-1)
 * @param convertToWebP Whether to convert the image to WebP format
 * @returns Promise resolving to a compressed File object
 */
export const compressImage = async (
  file: File,
  maxWidth = 1024,
  maxHeight = 768,
  quality = 0.8,
  convertToWebP = true
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
        
        // Get compressed image data in the requested format
        const mimeType = convertToWebP ? 'image/webp' : file.type;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob'));
              return;
            }
            
            // Create new File from blob
            const compressedFile = new File([blob], file.name.split('.')[0] + (convertToWebP ? '.webp' : ''), {
              type: mimeType,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          mimeType,
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
 * Checks if the browser supports WebP format
 * @returns Promise resolving to a boolean indicating WebP support
 */
export const supportsWebP = async (): Promise<boolean> => {
  if (!window.createImageBitmap) return false;
  
  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  const blob = await fetch(webpData).then(r => r.blob());
  
  return createImageBitmap(blob).then(() => true, () => false);
};

/**
 * Progressively compresses an image until it meets target size or quality floor
 * @param file Original image file
 * @param targetSizeMB Target size in MB (default: 5MB)
 * @param minQuality Minimum quality to try (0-1)
 * @param maxWidth Maximum width to resize to
 * @returns Promise resolving to compressed File
 */
export const progressiveCompress = async (
  file: File,
  targetSizeMB = 5,
  minQuality = 0.5,
  maxWidth = 2048
): Promise<File> => {
  // If already below target size, return original
  if (file.size <= targetSizeMB * 1024 * 1024) {
    return file;
  }

  // Start with reasonable quality and dimensions
  const webpSupported = await supportsWebP();
  let quality = 0.9;
  let width = maxWidth;
  let result = file;
  let attempts = 0;
  const maxAttempts = 4;  // Limit to prevent infinite loops
  
  while (
    result.size > targetSizeMB * 1024 * 1024 && 
    quality >= minQuality &&
    attempts < maxAttempts
  ) {
    // Compress with current settings
    result = await compressImage(
      file, 
      width, 
      Math.round(width * 0.75), // Assume 4:3 aspect ratio as fallback
      quality,
      webpSupported
    );
    
    // If still too large, reduce quality and/or dimensions
    if (result.size > targetSizeMB * 1024 * 1024) {
      quality -= 0.1;  // Reduce quality
      width = Math.round(width * 0.9);  // Reduce dimensions by 10%
    }
    
    attempts++;
  }
  
  return result;
};

/**
 * Pre-processes an image before upload to check size and apply compression if needed
 * @param file Original image file
 * @param maxSizeMB Maximum acceptable size in MB (prevents uploading files larger than this)
 * @param targetSizeMB Target size for compression if file exceeds this size
 * @returns Promise resolving to optimized File ready for upload
 */
export const preProcessImageForUpload = async (
  file: File,
  maxSizeMB = 25,
  targetSizeMB = 5
): Promise<File> => {
  // Hard reject for files exceeding absolute maximum size
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum size is ${maxSizeMB} MB.`);
  }
  
  // If smaller than target size, return as is
  if (file.size <= targetSizeMB * 1024 * 1024) {
    return file;
  }
  
  // Otherwise apply progressive compression
  return progressiveCompress(file, targetSizeMB);
};

/**
 * Optimizes an image for web, converting to WebP if supported
 * @param file The image file to optimize
 * @returns Promise resolving to an optimized File object
 */
export const optimizeImage = async (file: File): Promise<File> => {
  // Check file size, only compress if larger than 100KB
  if (file.size < 100 * 1024) {
    return file;
  }
  
  const webpSupported = await supportsWebP();
  
  // Determine appropriate dimensions based on file size
  let maxWidth = 1600;
  let maxHeight = 1200;
  let quality = 0.8;
  
  if (file.size > 5 * 1024 * 1024) { // > 5MB
    maxWidth = 1200;
    maxHeight = 900;
    quality = 0.7;
  } else if (file.size > 2 * 1024 * 1024) { // > 2MB
    maxWidth = 1400;
    maxHeight = 1050;
    quality = 0.75;
  }
  
  return compressImage(file, maxWidth, maxHeight, quality, webpSupported);
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
  // First compress and optimize the image
  const optimizedFile = await optimizeImage(file);
  
  // Create a unique filename
  const fileExt = optimizedFile.name.split('.').pop();
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
    contentType: optimizedFile.type,
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
    .upload(fileName, optimizedFile, options);
    
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
 * Batch uploads multiple images to Supabase storage with parallel processing
 * @param files Array of image files to upload
 * @param bucket Storage bucket name
 * @param path Path within storage bucket
 * @param onProgress Optional callback for overall upload progress
 * @param onFileProgress Optional callback for individual file progress
 * @param concurrency Maximum number of simultaneous uploads (default: 3)
 * @returns Promise resolving to array of uploaded file URLs
 */
export const batchUploadImages = async (
  files: File[],
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void,
  onFileProgress?: (fileIndex: number, progress: number) => void,
  concurrency = 3
): Promise<string[]> => {
  if (files.length === 0) return [];
  
  const urls: string[] = [];
  let completedFiles = 0;
  
  // Process files in batches according to concurrency limit
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      return uploadImageRealtime(
        file,
        bucket,
        path,
        (progress) => {
          if (onFileProgress) {
            onFileProgress(fileIndex, progress);
          }
        }
      ).then(url => {
        completedFiles++;
        if (onProgress) {
          onProgress(Math.round((completedFiles / files.length) * 100));
        }
        return url;
      });
    });
    
    // Wait for the current batch to complete before starting the next batch
    const batchUrls = await Promise.all(batchPromises);
    urls.push(...batchUrls);
  }
  
  return urls;
};

// Original functions kept for backward compatibility
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isVideo = (file: File): boolean => {
  return file.type.startsWith('video/');
};
