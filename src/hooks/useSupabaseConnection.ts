
import { useState, useEffect, useCallback } from 'react';
import SupabaseRegionDetector from '@/utils/supabaseRegionDetector';
import { adaptiveClient } from '@/integrations/supabase/adaptiveClient';

type ConnectionStatus = 'checking' | 'connected' | 'blocked' | 'proxy' | 'error';

interface UseSupabaseConnectionReturn {
  status: ConnectionStatus;
  isBlocked: boolean;
  isConnected: boolean;
  retry: () => Promise<void>;
  switchToProxy: () => Promise<void>;
}

export const useSupabaseConnection = (): UseSupabaseConnectionReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  const checkConnection = useCallback(async () => {
    setStatus('checking');
    
    try {
      const detector = SupabaseRegionDetector.getInstance();
      await detector.detectRegion();
      const connectionStatus = detector.getConnectionStatus();
      setStatus(connectionStatus);
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('error');
    }
  }, []);

  const retry = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  const switchToProxy = useCallback(async () => {
    try {
      setStatus('checking');
      await adaptiveClient.switchToProxy();
      setStatus('proxy');
    } catch (error) {
      console.error('Failed to switch to proxy:', error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    isBlocked: status === 'blocked',
    isConnected: status === 'connected' || status === 'proxy',
    retry,
    switchToProxy
  };
};
