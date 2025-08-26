import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeAuthFetch } from '@/utils/authFetch';

// Hook for authenticated queries with automatic 401 handling
export function useAuthQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery({
    queryKey,
    queryFn: () => safeAuthFetch(queryFn),
    ...options,
  });
}

// Hook for authenticated mutations with automatic 401 handling
export function useAuthMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: any
) {
  return useMutation({
    mutationFn: (variables: V) => safeAuthFetch(() => mutationFn(variables)),
    ...options,
  });
}

// Hook for invalidating queries safely after mutations
export function useAuthQueryInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    invalidateQueries: (queryKey: any[]) => {
      queryClient.invalidateQueries({ queryKey });
    },
    refetchQueries: (queryKey: any[]) => {
      queryClient.refetchQueries({ queryKey });
    },
    setQueryData: <T>(queryKey: any[], updater: T | ((old?: T) => T)) => {
      queryClient.setQueryData(queryKey, updater);
    }
  };
}