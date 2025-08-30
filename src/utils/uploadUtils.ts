// Upload utilities for deterministic session management

export interface UploadSessionParams {
  userId: string;
  scope: 'new-order' | 'product' | 'order';
  scopeId?: string; // productId / orderId or undefined for new
}

export function getUploadSessionKey(params: UploadSessionParams): string {
  const base = [params.userId, params.scope, params.scopeId ?? 'draft'].join(':');
  return `spu:${base}`; // SimplePhotoUploader
}

// Generate tiny preview dataURL for persistence
export async function makeTinyPreviewDataUrl(file: File, maxSide = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      // Calculate dimensions
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // Cleanup
      URL.revokeObjectURL(img.src);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for preview'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Check if file is HEIC/HEIF
export function isHeicFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif') ||
         file.type.toLowerCase().includes('heic') ||
         file.type.toLowerCase().includes('heif') ||
         file.type === 'image/heic' || 
         file.type === 'image/heif';
}