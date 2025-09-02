// Network profile detection for cellular-safe Realtime mode

export interface NetworkProfile {
  type: string;
  effectiveType: string;
  saveData: boolean;
  downlink: number | null;
  rtt: number | null;
}

/**
 * Get current network profile from Navigator API
 */
export function getNetworkProfile(): NetworkProfile {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    type: connection?.type ?? 'unknown',
    effectiveType: connection?.effectiveType ?? 'unknown',
    saveData: !!connection?.saveData,
    downlink: connection?.downlink ?? null,
    rtt: connection?.rtt ?? null,
  };
}

/**
 * Detect if current connection is likely slow/unstable cellular
 * These connections are prone to WebSocket failures
 */
export function isLikelyCellularSlow(profile?: NetworkProfile): boolean {
  const p = profile || getNetworkProfile();
  
  // Direct cellular detection
  if (p.type === 'cellular') {
    return true;
  }
  
  // Slow connection types
  if (['slow-2g', '2g', '3g'].includes(p.effectiveType)) {
    return true;
  }
  
  // Data saver mode enabled
  if (p.saveData === true) {
    return true;
  }
  
  // Low bandwidth (< 1.5 Mbps)
  if (p.downlink && p.downlink < 1.5) {
    return true;
  }
  
  // High latency (> 800ms)
  if (p.rtt && p.rtt > 800) {
    return true;
  }
  
  return false;
}

/**
 * Get recommended Realtime mode based on network conditions
 */
export function getRecommendedRealtimeMode(): 'on' | 'degraded' | 'off' {
  try {
    const profile = getNetworkProfile();
    
    if (isLikelyCellularSlow(profile)) {
      return 'degraded'; // Start in degraded mode for slow connections
    }
    
    return 'on'; // Normal mode for good connections
  } catch (error) {
    console.warn('⚠️ [NetProfile] Failed to detect network, defaulting to degraded mode:', error);
    return 'degraded'; // Safe default
  }
}

/**
 * Log network profile for debugging
 */
export function logNetworkProfile(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const profile = getNetworkProfile();
    const isSlowCellular = isLikelyCellularSlow(profile);
    const recommendedMode = getRecommendedRealtimeMode();
    
    console.log('📶 [NetProfile] Network conditions:', {
      profile,
      isSlowCellular,
      recommendedMode,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });
  } catch (error) {
    console.warn('⚠️ [NetProfile] Failed to log network profile:', error);
  }
}