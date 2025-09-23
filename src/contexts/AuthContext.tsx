// Migration wrapper - gradually transitioning to micro-contexts
import { OptimizedAuthProvider, useAuth as useOptimizedAuth } from './auth/OptimizedAuthProvider';

// Export optimized version with full compatibility
export { OptimizedAuthProvider as AuthProvider };
export const useAuth = useOptimizedAuth;