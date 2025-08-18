/**
 * Utility functions for image handling and deduplication
 */

/**
 * Remove duplicate images from an array of image URLs
 * @param images Array of image URLs
 * @returns Array of unique image URLs, preserving original order
 */
export function removeDuplicateImages(images: string[]): string[] {
  if (!Array.isArray(images)) {
    console.warn('removeDuplicateImages: Input is not an array, returning empty array');
    return [];
  }

  const seen = new Set<string>();
  const uniqueImages: string[] = [];
  
  for (const image of images) {
    if (image && typeof image === 'string' && image.trim() && !seen.has(image)) {
      seen.add(image);
      uniqueImages.push(image);
    }
  }
  
  const duplicatesCount = images.length - uniqueImages.length;
  if (duplicatesCount > 0) {
    console.log(`🔧 Removed ${duplicatesCount} duplicate images:`, {
      original_count: images.length,
      unique_count: uniqueImages.length,
      duplicates_removed: duplicatesCount
    });
  }
  
  return uniqueImages;
}

/**
 * Combine product images with additional images, removing duplicates
 * @param productImages Images from the product
 * @param additionalImages Additional order-specific images
 * @returns Combined array of unique images
 */
export function combineAndDeduplicateImages(
  productImages: string[], 
  additionalImages: string[]
): string[] {
  const allImages = [...(productImages || []), ...(additionalImages || [])];
  return removeDuplicateImages(allImages);
}