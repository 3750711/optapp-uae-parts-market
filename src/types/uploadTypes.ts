// Types for persistent upload system

export interface PersistedUploadItem {
  id: string;
  publicId: string;
  status: 'pending' | 'compressing' | 'signing' | 'uploading' | 'completed' | 'error';
  progress: number;
  
  // Recoverable previews after page refresh
  localPreviewDataUrl?: string;    // for before upload (non-HEIC)
  cloudinaryUrl?: string;          // final URL after upload
  cloudinaryThumbUrl?: string;     // final preview URL (with transformation)
  
  // File metadata
  isHeic?: boolean;
  originalName?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
  
  // Timestamps for cleanup
  createdAt: number;
  updatedAt: number;
}

export interface PersistedUploadSession {
  sessionKey: string;
  items: PersistedUploadItem[];
  createdAt: number;
  updatedAt: number;
}