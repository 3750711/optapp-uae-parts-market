import { getRuntimeSupabaseUrl } from '@/config/runtimeSupabase';

/**
 * Rewrites Storage URLs to use the proxy domain consistently
 * Handles both public URLs and storage paths
 */
export function rewriteStorageUrl(url: string): string {
  if (!url) return url;
  
  const proxyUrl = getRuntimeSupabaseUrl();
  
  // Handle full URLs that might contain supabase.co domains
  if (url.includes('.supabase.co/storage/')) {
    return url.replace(/https:\/\/[^/]+\.supabase\.co\/storage\//, `${proxyUrl}/storage/`);
  }
  
  // Handle relative storage paths
  if (url.startsWith('/storage/v1/object/public/')) {
    return `${proxyUrl}${url}`;
  }
  
  // Handle storage bucket paths
  if (url.match(/^[^/]+\/[^/]+$/)) {
    return `${proxyUrl}/storage/v1/object/public/${url}`;
  }
  
  return url;
}

/**
 * Extracts the file path from a storage URL for use with Supabase client
 */
export function extractStorageFilePath(url: string, bucketName?: string): string {
  if (!url) return '';
  
  // Handle full URLs
  const storagePattern = new RegExp(`/storage/v1/object/public/${bucketName || '[^/]+'}/(.*)`);
  const match = url.match(storagePattern);
  if (match) return match[1];
  
  // Handle direct paths
  if (bucketName && url.startsWith(`${bucketName}/`)) {
    return url.substring(bucketName.length + 1);
  }
  
  // Handle file paths that are already extracted
  if (!url.includes('/')) return url;
  
  return url.split('/').pop() || '';
}