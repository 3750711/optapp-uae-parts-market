
import imageCompression from "browser-image-compression";

/**
 * Compresses an image file
 * 
 * @param imageFile - The file to compress
 * @param maxWidth - Maximum width of the compressed image
 * @param maxHeight - Maximum height of the compressed image
 * @param quality - Quality of the compressed image (0 to 1)
 * @returns Promise<File> - The compressed file
 */
export const compressImage = async (
  imageFile: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  try {
    return await imageCompression(imageFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      initialQuality: quality,
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return imageFile; // Return original file if compression fails
  }
};

/**
 * Checks if a file is an image based on its MIME type
 * 
 * @param file - The file to check
 * @returns boolean - True if the file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if a file is a video based on its MIME type
 * 
 * @param file - The file to check
 * @returns boolean - True if the file is a video
 */
export const isVideo = (file: File): boolean => {
  return file.type.startsWith('video/');
};
