// Cloudinary XMLHttpRequest upload with real-time progress tracking
// This provides accurate progress callbacks for better UX

export interface ProgressUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
  aborted?: boolean;
}

export interface CloudinaryFormData {
  file: File;
  timestamp: number;
  signature: string;
  api_key: string;
  folder?: string;
  public_id?: string;
  transformation?: string;
}

export class CloudinaryProgressUploader {
  private xhr: XMLHttpRequest | null = null;
  private aborted = false;

  async upload(
    file: File,
    formData: CloudinaryFormData,
    onProgress?: (progress: number) => void
  ): Promise<ProgressUploadResult> {
    return new Promise((resolve) => {
      this.aborted = false;
      this.xhr = new XMLHttpRequest();

      // Setup progress tracking
      this.xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress && !this.aborted) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`📊 XMLHttpRequest progress: ${progress}%`);
          onProgress(progress);
        }
      });

      // Setup response handlers
      this.xhr.addEventListener('load', () => {
        if (this.aborted) {
          resolve({ success: false, aborted: true });
          return;
        }

        try {
          const response = JSON.parse(this.xhr!.responseText);
          
          if (this.xhr!.status === 200 && response.secure_url) {
            console.log('✅ Cloudinary XMLHttpRequest upload successful:', response.secure_url);
            resolve({
              success: true,
              url: response.secure_url,
              publicId: response.public_id
            });
          } else {
            console.error('❌ Cloudinary XMLHttpRequest upload failed:', response);
            resolve({
              success: false,
              error: response.error?.message || `HTTP ${this.xhr!.status}`
            });
          }
        } catch (error) {
          console.error('❌ Failed to parse Cloudinary response:', error);
          resolve({
            success: false,
            error: 'Invalid response format'
          });
        }
      });

      this.xhr.addEventListener('error', () => {
        if (!this.aborted) {
          console.error('❌ XMLHttpRequest network error');
          resolve({
            success: false,
            error: 'Network error during upload'
          });
        }
      });

      this.xhr.addEventListener('timeout', () => {
        if (!this.aborted) {
          console.error('❌ XMLHttpRequest timeout');
          resolve({
            success: false,
            error: 'Upload timeout'
          });
        }
      });

      this.xhr.addEventListener('abort', () => {
        console.log('🚫 XMLHttpRequest upload aborted');
        resolve({
          success: false,
          aborted: true
        });
      });

      // Prepare FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('timestamp', formData.timestamp.toString());
      uploadFormData.append('signature', formData.signature);
      uploadFormData.append('api_key', formData.api_key);
      
      if (formData.folder) uploadFormData.append('folder', formData.folder);
      if (formData.public_id) uploadFormData.append('public_id', formData.public_id);
      if (formData.transformation) uploadFormData.append('transformation', formData.transformation);

      // Configure and send request
      this.xhr.timeout = 120000; // 2 minutes timeout
      
      // Get cloud name from signature data
      const cloudName = formData.api_key ? 'dcuziurrb' : 'YOUR_CLOUD_NAME';
      this.xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      
      console.log('🚀 Starting XMLHttpRequest upload for:', file.name);
      this.xhr.send(uploadFormData);
    });
  }

  abort(): void {
    if (this.xhr && !this.aborted) {
      console.log('🚫 Aborting XMLHttpRequest upload');
      this.aborted = true;
      this.xhr.abort();
    }
  }

  isUploading(): boolean {
    return this.xhr !== null && this.xhr.readyState !== XMLHttpRequest.DONE && !this.aborted;
  }
}

// Factory function for easier usage
export const createProgressUploader = () => new CloudinaryProgressUploader();

// Helper function to use with existing signature system
export const uploadWithProgress = async (
  file: File,
  signature: any, // Use existing signature from getCloudinarySignature
  onProgress?: (progress: number) => void
): Promise<ProgressUploadResult> => {
  const uploader = createProgressUploader();
  
  const formData: CloudinaryFormData = {
    file,
    timestamp: signature.timestamp,
    signature: signature.signature,
    api_key: signature.api_key,
    folder: signature.folder,
    transformation: signature.transformation
  };

  return uploader.upload(file, formData, onProgress);
};