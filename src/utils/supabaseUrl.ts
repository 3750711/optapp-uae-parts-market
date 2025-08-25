import { STORAGE_BUCKETS } from "@/constants/storage";

/**
 * Converts a relative path or ensures a full URL for Supabase Storage
 * If the input is already a full URL, returns it as is
 * If it's a relative path, converts it to a full public URL
 */
export function toPublicSupabaseUrl(pathOrUrl?: string, bucket = STORAGE_BUCKETS.PRODUCT_IMAGES) {
  if (!pathOrUrl) return "";
  
  // Already a full URL
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = "https://vfiylfljiixqkjfqubyq.supabase.co";
  // Remove leading slashes from path
  const cleanPath = String(pathOrUrl).replace(/^\/+/, "");

  // Path already contains the storage path structure
  if (cleanPath.startsWith("storage/v1/object/public/")) {
    return `${base}/${cleanPath}`;
  }

  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}