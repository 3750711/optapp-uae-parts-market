
import imageCompression from 'browser-image-compression';

/**
 * Checks if a file is an image based on its MIME type.
 * @param file The file to check.
 * @returns True if the file is an image, false otherwise.
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Checks if a file is a video based on its MIME type.
 * @param file The file to check.
 * @returns True if the file is a video, false otherwise.
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Compresses an image to the specified dimensions and quality.
 * @param file The original image file.
 * @param maxWidth Maximum width of the compressed image.
 * @param maxHeight Maximum height of the compressed image.
 * @param quality Compression quality (0-1).
 * @returns A promise that resolves with the compressed file.
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 768,
  quality: number = 0.8
): Promise<File> {
  try {
    const options = {
      maxSizeMB: 1, // Maximum size in MB
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      fileType: file.type,
      quality: quality,
    };

    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Optimizes an image for upload, targeting around 1MB size
 * @param file Original image file
 * @returns Optimized image file
 */
export async function optimizeImage(file: File): Promise<File> {
  // Only process images over 1MB
  if (file.size <= 1024 * 1024) {
    console.log('Image already under 1MB, no optimization needed');
    return file;
  }

  try {
    // Initialize compression options - higher quality for regular images (target 1MB)
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920, // Maintain good resolution for full-size display
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    };

    // Use browser-image-compression library for better compression
    const compressedFile = await imageCompression(file, options);
    
    console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Create a new File object with the original name but compressed data
    return new File([compressedFile], file.name, {
      type: options.fileType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original file if optimization fails
    return file;
  }
}

/**
 * Creates a small preview image suitable for catalog display (200KB or less)
 * @param file Original image file
 * @returns Preview image file
 */
export async function createPreviewImage(file: File): Promise<File> {
  try {
    // Initialize compression options - lower quality for preview images (target 200KB)
    const options = {
      maxSizeMB: 0.2, // 200KB
      maxWidthOrHeight: 400, // Smaller resolution for previews
      useWebWorker: true,
      fileType: 'image/webp' // Always use WebP for previews for better compression
    };

    // Use browser-image-compression library for better compression
    const compressedFile = await imageCompression(file, options);
    
    console.log('Original file size:', (file.size / 1024).toFixed(2), 'KB');
    console.log('Preview file size:', (compressedFile.size / 1024).toFixed(2), 'KB');
    
    // Create a new File object with preview indication in the name
    const fileName = file.name.split('.');
    const fileNameBase = fileName.slice(0, -1).join('.');
    const previewFileName = `${fileNameBase}-preview.webp`;
    
    return new File([compressedFile], previewFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error creating preview image:', error);
    throw error;
  }
}

/**
 * Pre-processes an image for upload, compressing it if necessary to meet size requirements.
 * @param file The original image file.
 * @param maxFileSizeMB The maximum file size allowed (in MB).
 * @param targetSizeKB The target file size after compression (in KB).
 * @returns The processed image file, either compressed or the original if no compression was needed.
 */
export async function preProcessImageForUpload(
  file: File,
  maxFileSizeMB: number,
  targetSizeKB: number
): Promise<File> {
  if (file.size > maxFileSizeMB * 1024 * 1024) {
    console.log(`Image ${file.name} exceeds maximum size, compressing...`);
    try {
      const compressedFile = await progressiveCompress(file, targetSizeKB);
      console.log(`Image ${file.name} compressed successfully.`);
      return compressedFile;
    } catch (error) {
      console.error(`Failed to compress image ${file.name}:`, error);
      throw error;
    }
  } else {
    console.log(`Image ${file.name} is within size limits, no compression needed.`);
    return file;
  }
}

/**
 * Progressively compresses an image until it reaches the target size or a maximum number of iterations is reached.
 * @param file The original image file.
 * @param targetSizeKB The target file size after compression (in KB).
 * @param qualityStart Initial quality for compression.
 * @param qualityDecrement The amount to decrement the quality by each iteration.
 * @param maxIterations Maximum number of compression iterations.
 * @returns A promise that resolves with the compressed image file, or rejects if compression fails.
 */
export async function progressiveCompress(
  file: File,
  targetSizeKB: number,
  qualityStart: number = 0.9,
  qualityDecrement: number = 0.1,
  maxIterations: number = 5
): Promise<File> {
  let compressedFile: File = file;
  let currentQuality = qualityStart;
  
  for (let i = 0; i < maxIterations; i++) {
    console.log(`Compression iteration ${i + 1} with quality ${currentQuality}`);
    
    const options = {
      maxSizeMB: targetSizeKB / 1024, // Dynamic max size based on target
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: currentQuality,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    };
    
    try {
      compressedFile = await imageCompression(file, options);
      console.log(`Compressed file size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
      
      if (compressedFile.size <= targetSizeKB * 1024) {
        console.log(`Target size achieved in ${i + 1} iterations.`);
        return compressedFile;
      }
      
      currentQuality -= qualityDecrement;
      if (currentQuality <= 0) {
        console.warn('Compression quality reached zero, unable to meet target size.');
        break;
      }
    } catch (error) {
      console.error('Error during compression:', error);
      throw error;
    }
  }
  
  if (compressedFile.size > targetSizeKB * 1024) {
    console.warn('Maximum iterations reached, but target size not achieved.');
  }
  
  return compressedFile;
}

/**
 * Uploads images in batches to avoid exceeding memory limits.
 * @param files Array of image files to upload.
 * @param storageBucket The Supabase storage bucket to upload to.
 * @param storagePath The path within the bucket to upload to.
 * @param onOverallProgress Callback to track overall upload progress.
 * @param onFileProgress Callback to track individual file upload progress.
 * @param maxConcurrentUploads Maximum number of concurrent uploads.
 * @returns A promise that resolves with an array of URLs for the uploaded images.
 */
export async function batchUploadImages(
  files: File[],
  storageBucket: string,
  storagePath: string,
  onOverallProgress: (progress: number) => void,
  onFileProgress: (fileIndex: number, progress: number) => void,
  maxConcurrentUploads: number = 3
): Promise<string[]> {
  // Use Supabase from integrations
  const { supabase } = await import('@/integrations/supabase/client');
  
  const uploadedUrls: string[] = [];
  const totalFiles = files.length;
  let completedFiles = 0;
  let uploadErrors = 0;

  // Function to upload a single file
  const uploadFile = async (file: File, fileIndex: number): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const uniqueId = `${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    const fileName = `${storagePath}/${uniqueId}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error(`Upload error for ${file.name}:`, error);
        uploadErrors++;
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      uploadErrors++;
      return null;
    } finally {
      completedFiles++;
      const overallProgress = Math.round((completedFiles / totalFiles) * 100);
      onOverallProgress(overallProgress);
    }
  };

  // Create an array of promises for each file upload
  const uploadPromises = files.map((file, fileIndex) => {
    return new Promise<void>(async (resolve) => {
      const url = await uploadFile(file, fileIndex);
      if (url) {
        uploadedUrls.push(url);
      }
      resolve();
    });
  });

  // Function to process uploads in chunks
  async function processUploadsInChunks() {
    for (let i = 0; i < uploadPromises.length; i += maxConcurrentUploads) {
      const chunk = uploadPromises.slice(i, i + maxConcurrentUploads);
      await Promise.all(
        chunk.map((uploadPromise, index) => {
          const fileIndex = i + index;
          return new Promise<void>(resolve => {
            // Mock progress updates (replace with actual upload progress if possible)
            const interval = setInterval(() => {
              const progress = Math.min(Math.random() * 50 + 50, 99); // Simulate progress
              onFileProgress(fileIndex, Math.round(progress));
            }, 200);

            uploadPromise.then(() => {
              clearInterval(interval);
              onFileProgress(fileIndex, 100);
              resolve();
            });
          });
        })
      );
    }
  }

  // Start processing uploads in chunks
  await processUploadsInChunks();

  if (uploadErrors > 0) {
    console.warn(`There were ${uploadErrors} errors during upload.`);
  }

  return uploadedUrls;
}
