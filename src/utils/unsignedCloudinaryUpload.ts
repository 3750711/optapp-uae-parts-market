// Direct unsigned Cloudinary uploads - bypasses all Edge Functions and CORS
const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';
const UNSIGNED_UPLOAD_PRESET = 'admin_orders_preset'; // Universal unsigned preset for admin orders

export interface UnsignedUploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

// Direct unsigned upload to Cloudinary for all file types
export const uploadUnsignedDirect = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UnsignedUploadResult> => {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UNSIGNED_UPLOAD_PRESET);
    formData.append('folder', 'admin-orders');
    
    // Add eager transformations for fast preview
    formData.append('eager', 'c_limit,w_400,q_auto:low|c_limit,w_1200,q_auto:good');
    
    // Add tags for organization
    formData.append('tags', 'admin-free-order,emergency-upload');
    
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.public_id && response.secure_url) {
            // Clean public_id
            const cleanPublicId = response.public_id.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
            
            // Generate optimized URL with c_limit (no cropping)
            const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
            
            resolve({
              success: true,
              publicId: cleanPublicId,
              url: optimizedUrl,
              originalSize: file.size,
              compressedSize: response.bytes
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid Cloudinary response'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to parse Cloudinary response'
          });
        }
      } else {
        resolve({
          success: false,
          error: `Upload failed: ${xhr.status} ${xhr.statusText}`
        });
      }
    };
    
    xhr.onerror = () => resolve({
      success: false,
      error: 'Network error'
    });
    
    xhr.ontimeout = () => resolve({
      success: false,
      error: 'Upload timeout'
    });
    
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.timeout = 180000; // 3 minutes
    xhr.send(formData);
  });
};

// Batch upload multiple files
export const uploadMultipleUnsigned = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void,
  onFileComplete?: (fileIndex: number, result: UnsignedUploadResult) => void
): Promise<UnsignedUploadResult[]> => {
  const results: UnsignedUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await uploadUnsignedDirect(file, (progress) => {
        onProgress?.(i, progress);
      });
      
      results.push(result);
      onFileComplete?.(i, result);
    } catch (error) {
      const errorResult: UnsignedUploadResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
      results.push(errorResult);
      onFileComplete?.(i, errorResult);
    }
  }
  
  return results;
};