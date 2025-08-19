import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileAccessStat {
  accessed_profile_id: string;
  accessed_profile_name: string;
  accessor_count: number;
  access_count: number;
  last_access: string;
}

interface UseProfileAccessStatsProps {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export const useProfileAccessStats = ({ 
  startDate, 
  endDate, 
  enabled = true 
}: UseProfileAccessStatsProps = {}) => {
  const { isAdmin } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile-access-stats', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ProfileAccessStat[]> => {
      if (!isAdmin) {
        throw new Error('Access denied. Only admins can view access statistics.');
      }

      const { data, error } = await supabase.rpc('get_profile_access_stats', {
        p_start_date: startDate?.toISOString(),
        p_end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Error fetching profile access stats:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && isAdmin === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
    isAdmin
  };
};