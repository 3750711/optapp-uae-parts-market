// Unified Worker System Types
export interface CompressionTask {
  id: string;
  file: File;
  maxSide: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  targetSize?: number;
  networkType?: string;
}

export interface CompressionResult {
  id: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionMs: number;
  passes: number;
  method: 'smart' | 'stable' | 'browser' | 'original';
  error?: string;
}

export interface WorkerCapabilities {
  hasOffscreenCanvas: boolean;
  hasWebGPU: boolean;
  maxMemory: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
}

export interface CompressionProfile {
  maxSide: number;
  quality: number;
  targetSize: number;
  concurrency: number;
  timeout: number;
  method: 'smart' | 'stable' | 'browser';
}

export interface CompressionMetrics {
  totalFiles: number;
  successfulCompressions: number;
  averageCompressionRatio: number;
  averageCompressionTime: number;
  methodSuccessRates: Record<string, { attempts: number; successes: number }>;
  networkProfile: string;
  deviceProfile: string;
}