import { getProductImageUrl, extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { toPublicSupabaseUrl } from "@/utils/supabaseUrl";

/**
 * Builds a comprehensive array of product images from all available sources
 * Priority: Cloudinary (optimized) > Supabase Storage
 * Filters empty values and removes duplicates
 */
export function buildProductImages(product: any): string[] {
  const images: string[] = [];

  // 1) Cloudinary - publicId in priority (provides optimized sizes)
  if (product?.cloudinary_public_id) {
    images.push(getProductImageUrl(product.cloudinary_public_id, "detail"));
  }

  // 2) If there's a raw cloudinary_url - add it (for legacy records)
  if (product?.cloudinary_url) {
    const pid = extractPublicIdFromUrl(product.cloudinary_url);
    images.push(pid ? getProductImageUrl(pid, "detail") : product.cloudinary_url);
  }

  // 3) Supabase Storage - from product_images.url
  if (Array.isArray(product?.product_images)) {
    for (const img of product.product_images) {
      if (!img) continue;
      const raw = img.url || "";
      const url = toPublicSupabaseUrl(raw);
      if (url) images.push(url);
    }
  }

  // Remove empty values and duplicates
  const unique = Array.from(new Set(images.filter(Boolean)));
  return unique;
}