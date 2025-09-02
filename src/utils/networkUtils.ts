interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  downlink?: number;
  rtt?: number;
}

export const getNetworkInfo = (): NetworkInfo => {
  const connection = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
  
  return {
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt
  };
};

export const isSlowConnection = (): boolean => {
  const { effectiveType } = getNetworkInfo();
  return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
};

export const getTimeoutForConnection = (): { general: number; auth: number } => {
  const isSlowConn = isSlowConnection();
  return isSlowConn 
    ? { general: 30000, auth: 45000 } // Increased timeouts for slow connections
    : { general: 15000, auth: 30000 }; // Standard timeouts
};

export const getQueryConfigForConnection = () => {
  const isSlowConn = isSlowConnection();
  return {
    staleTime: isSlowConn ? 30 * 60 * 1000 : 10 * 60 * 1000, // 30min vs 10min
    gcTime: isSlowConn ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000, // 2h vs 1h
    refetchOnWindowFocus: !isSlowConn,
    refetchOnReconnect: !isSlowConn,
    retry: isSlowConn ? 0 : 1 // No retries on slow connections
  };
};