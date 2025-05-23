
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
