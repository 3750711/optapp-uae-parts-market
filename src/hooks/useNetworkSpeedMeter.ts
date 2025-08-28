import { useState, useCallback, useRef } from 'react';

export interface NetworkProfile {
  type: '3g' | '4g' | 'wifi';
  bytesPerSecond: number;
  rtt: number;
  effectiveType: string;
}

export interface UploadMetrics {
  originalBytes: number;
  compressedBytes: number;
  uploadMs: number;
  bytesPerSec: number;
  retries: number;
  compressionMs: number;
  signingMs: number;
}

const TARGET_UPLOAD_TIME = 9000; // 9 seconds target

export const useNetworkSpeedMeter = () => {
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile>({
    type: 'wifi',
    bytesPerSecond: 700_000, // Default fallback
    rtt: 100,
    effectiveType: '4g'
  });
  
  const [uploadMetrics, setUploadMetrics] = useState<UploadMetrics[]>([]);
  const emaBytesPerSec = useRef<number>(0);

  // Get network connection info
  const getConnectionInfo = useCallback((): Partial<NetworkProfile> => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType || '4g';
      const rtt = connection.rtt || 100;
      
      // Map effective types to our profiles
      let type: '3g' | '4g' | 'wifi' = 'wifi';
      let fallbackSpeed = 700_000;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
        case '3g':
          type = '3g';
          fallbackSpeed = 350_000;
          break;
        case '4g':
          type = '4g';
          fallbackSpeed = 600_000;
          break;
        default:
          type = 'wifi';
          fallbackSpeed = 800_000;
      }
      
      return {
        type,
        rtt,
        effectiveType,
        bytesPerSecond: emaBytesPerSec.current || fallbackSpeed
      };
    }
    
    // Check for saveData hint (usually indicates slower connection)
    const saveData = (navigator as any).connection?.saveData;
    if (saveData) {
      return {
        type: '3g',
        bytesPerSecond: 350_000,
        rtt: 200,
        effectiveType: '3g'
      };
    }
    
    return {
      type: 'wifi',
      bytesPerSecond: 700_000,
      rtt: 100,
      effectiveType: '4g'
    };
  }, []);

  // Calculate target file size based on network speed
  const getTargetFileSize = useCallback((profileOverride?: Partial<NetworkProfile>): number => {
    const profile = { ...networkProfile, ...profileOverride };
    const targetBytes = Math.round((profile.bytesPerSecond * TARGET_UPLOAD_TIME) / 1000);
    
    // Clamp between reasonable bounds
    return Math.max(300_000, Math.min(900_000, targetBytes));
  }, [networkProfile]);

  // Update network profile from real upload data
  const updateFromUpload = useCallback((metrics: UploadMetrics) => {
    setUploadMetrics(prev => [...prev.slice(-4), metrics]); // Keep last 5
    
    // Update EMA (Exponential Moving Average) with real upload speed
    const alpha = 0.3; // Learning rate
    if (emaBytesPerSec.current === 0) {
      emaBytesPerSec.current = metrics.bytesPerSec;
    } else {
      emaBytesPerSec.current = emaBytesPerSec.current * (1 - alpha) + metrics.bytesPerSec * alpha;
    }
    
    // Update network profile
    const connectionInfo = getConnectionInfo();
    setNetworkProfile(prev => ({
      ...prev,
      ...connectionInfo,
      bytesPerSecond: emaBytesPerSec.current
    }));
  }, [getConnectionInfo]);

  // Get optimal compression settings for current network
  const getCompressionProfile = useCallback((profileOverride?: Partial<NetworkProfile>) => {
    const profile = { ...networkProfile, ...profileOverride };
    
    if (profile.type === '3g') {
      return {
        maxSide: 1024,
        quality: 0.72,
        concurrency: 1,
        targetSize: getTargetFileSize(profileOverride)
      };
    } else if (profile.type === '4g') {
      return {
        maxSide: 1280,
        quality: 0.78,
        concurrency: 2,
        targetSize: getTargetFileSize(profileOverride)
      };
    } else {
      return {
        maxSide: 1280,
        quality: 0.82,
        concurrency: 3,
        targetSize: getTargetFileSize(profileOverride)
      };
    }
  }, [networkProfile, getTargetFileSize]);

  // Initialize network profile
  const initializeProfile = useCallback(() => {
    const connectionInfo = getConnectionInfo();
    setNetworkProfile(prev => ({ ...prev, ...connectionInfo }));
  }, [getConnectionInfo]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (uploadMetrics.length === 0) return null;
    
    const totalFiles = uploadMetrics.length;
    const avgUploadTime = uploadMetrics.reduce((sum, m) => sum + m.uploadMs, 0) / totalFiles;
    const avgCompressionRatio = uploadMetrics.reduce((sum, m) => sum + (1 - m.compressedBytes / m.originalBytes), 0) / totalFiles;
    const avgSpeed = uploadMetrics.reduce((sum, m) => sum + m.bytesPerSec, 0) / totalFiles;
    const totalRetries = uploadMetrics.reduce((sum, m) => sum + m.retries, 0);
    
    return {
      totalFiles,
      avgUploadTime: Math.round(avgUploadTime),
      avgCompressionRatio: Math.round(avgCompressionRatio * 100),
      avgSpeed: Math.round(avgSpeed / 1024), // KB/s
      totalRetries,
      targetTime: TARGET_UPLOAD_TIME
    };
  }, [uploadMetrics]);

  return {
    networkProfile,
    uploadMetrics,
    getTargetFileSize,
    getCompressionProfile,
    updateFromUpload,
    initializeProfile,
    getPerformanceSummary
  };
};