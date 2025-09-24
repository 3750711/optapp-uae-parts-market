interface SimpleFallbackResult {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  error?: string;
}

interface SimpleFallbackOptions {
  onProgress?: (progress: number) => void;
  maxRetries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * Simple Cloudinary fallback uploader
 * Direct upload to Cloudinary API without compression or optimization
 * Used when Edge Function fails
 */
export class SimpleCloudinaryFallback {
  private readonly cloudName = 'dcuziurrb';
  private readonly uploadPreset = 'ml_default'; // Unsigned preset

  async uploadFile(
    file: File, 
    options: SimpleFallbackOptions = {}
  ): Promise<SimpleFallbackResult> {
    const { 
      onProgress, 
      maxRetries = 2, 
      retryDelay = 2000,
      signal
    } = options;

    let lastError: any;

    // Try upload with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if aborted before starting attempt
        if (signal?.aborted) {
          throw new Error('Upload aborted');
        }

        console.log(`[SimpleCloudinaryFallback] Attempt ${attempt + 1}/${maxRetries + 1} for file:`, file.name);
        
        const result = await this.performUpload(file, onProgress, signal);
        
        console.log(`[SimpleCloudinaryFallback] Success on attempt ${attempt + 1}:`, result);
        return result;
        
      } catch (error) {
        console.warn(`[SimpleCloudinaryFallback] Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // If aborted, don't retry
        if (signal?.aborted || (error as Error).message === 'Upload aborted') {
          break;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await this.sleep(retryDelay, signal);
        }
      }
    }

    // All attempts failed
    const errorMessage = signal?.aborted ? 'Upload aborted' : `Не удалось загрузить файл после ${maxRetries + 1} попыток`;
    console.error(`[SimpleCloudinaryFallback] All ${maxRetries + 1} attempts failed for:`, file.name, lastError);
    
    return {
      success: false,
      error: errorMessage
    };
  }

  private async performUpload(
    file: File, 
    onProgress?: (progress: number) => void,
    signal?: AbortSignal
  ): Promise<SimpleFallbackResult> {
    
    // Generate simple public_id
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const publicId = `fallback/upload_${timestamp}_${randomId}`;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('public_id', publicId);
    formData.append('folder', 'fallback');

    // Create upload request with progress tracking
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        });
      }

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            if (response.public_id && response.secure_url) {
              resolve({
                success: true,
                publicId: response.public_id,
                cloudinaryUrl: response.secure_url
              });
            } else {
              reject(new Error('Invalid Cloudinary response: missing required fields'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Cloudinary response: ${parseError}`));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Configure and send request - shorter timeout for fallback
      xhr.timeout = 30000; // 30 seconds timeout for fallback
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);
      xhr.send(formData);
    });
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Sleep aborted'));
        return;
      }

      const timeoutId = setTimeout(resolve, ms);
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Sleep aborted'));
        });
      }
    });
  }
}

// Export singleton instance
export const simpleCloudinaryFallback = new SimpleCloudinaryFallback();

// Export utility function
export const uploadWithSimpleFallback = async (
  file: File,
  options?: SimpleFallbackOptions
): Promise<SimpleFallbackResult> => {
  return simpleCloudinaryFallback.uploadFile(file, options);
};