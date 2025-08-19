import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAccessLogData {
  profileId: string;
  accessType: 'view' | 'update' | 'create_order' | 'price_offer' | 'detailed_view';
  contextData?: Record<string, any>;
}

export const useProfileAccessLogger = () => {
  const logAccess = useCallback(async ({ 
    profileId, 
    accessType, 
    contextData = {} 
  }: ProfileAccessLogData) => {
    try {
      // Get user agent and IP from browser (IP will be null on client side)
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.rpc('log_profile_access', {
        p_accessed_profile_id: profileId,
        p_access_type: accessType,
        p_context_data: contextData,
        p_ip_address: null, // Will be handled by server
        p_user_agent: userAgent
      });

      if (error) {
        console.warn('Failed to log profile access:', error);
      }
    } catch (error) {
      // Silent fail - don't break app functionality
      console.warn('Profile access logging error:', error);
    }
  }, []);

  return { logAccess };
};