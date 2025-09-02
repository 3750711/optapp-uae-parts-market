import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNetworkProfile, isLikelyCellularSlow, logNetworkProfile } from '@/utils/netProfile';

export const useNetworkHandler = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastConnectionType: string | null = null;
    
    // Log network profile on mount
    logNetworkProfile();

    const handleOnline = () => {
      console.log('🌐 [Network] Connection restored, invalidating stale queries');
      
      // Invalidate all queries when coming back online
      queryClient.invalidateQueries({ 
        queryKey: ['statistics'],
        refetchType: 'active'
      });
    };

    const handleOffline = () => {
      console.log('📴 [Network] Connection lost, queries will use cached data');
    };

    const handleConnectionChange = () => {
      const profile = getNetworkProfile();
      const currentType = profile.type || profile.effectiveType;
      
      // Only invalidate if connection type actually changed (WiFi <-> Cellular)
      if (lastConnectionType && lastConnectionType !== currentType) {
        console.log(`🔄 [Network] Connection changed: ${lastConnectionType} → ${currentType}`);
        
        // Soft refresh for critical data when switching networks
        queryClient.invalidateQueries({ 
          queryKey: ['statistics'],
          refetchType: 'active'
        });
      }
      
      lastConnectionType = currentType;
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if supported
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [queryClient]);

  return {
    isOnline: navigator.onLine,
    isCellular: isLikelyCellularSlow(),
    networkProfile: getNetworkProfile()
  };
};