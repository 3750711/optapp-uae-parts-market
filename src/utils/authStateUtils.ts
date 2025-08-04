import { User, Session } from '@supabase/supabase-js';
import { ProfileType } from '@/components/profile/types';

export interface AuthState {
  user: User | null;
  profile: ProfileType | null;
  session: Session | null;
  isLoading: boolean;
}

export type UserAuthStatus = 
  | 'loading'
  | 'unauthenticated'
  | 'requires_registration'
  | 'pending_approval'
  | 'authenticated_buyer'
  | 'authenticated_seller'
  | 'authenticated_admin';

export const determineAuthStatus = (authState: AuthState): UserAuthStatus => {
  const { user, profile, isLoading } = authState;

  if (isLoading) {
    return 'loading';
  }

  if (!user) {
    return 'unauthenticated';
  }

  // Check if user requires full registration (Telegram users)
  if (user.user_metadata?.requires_full_registration) {
    return 'requires_registration';
  }

  if (!profile) {
    return 'requires_registration';
  }

  // Check verification status
  if (profile.verification_status === 'pending' && profile.user_type !== 'admin') {
    return 'pending_approval';
  }

  // Return authenticated status based on user type
  switch (profile.user_type) {
    case 'admin':
      return 'authenticated_admin';
    case 'seller':
      return 'authenticated_seller';
    case 'buyer':
    default:
      return 'authenticated_buyer';
  }
};

export const getRedirectPath = (status: UserAuthStatus): string | null => {
  switch (status) {
    case 'unauthenticated':
      return '/login';
    case 'requires_registration':
      return '/register?telegram=true';
    case 'pending_approval':
      return '/pending-approval';
    case 'authenticated_seller':
      return '/seller/dashboard';
    case 'authenticated_admin':
      return '/admin';
    case 'authenticated_buyer':
    case 'loading':
    default:
      return null; // Stay on current page
  }
};

export const shouldRedirect = (status: UserAuthStatus, currentPath: string): boolean => {
  const redirectPath = getRedirectPath(status);
  
  if (!redirectPath) {
    return false;
  }

  // Don't redirect if already on the target path
  if (currentPath === redirectPath) {
    return false;
  }

  // Special handling for registration path
  if (redirectPath === '/register?telegram=true' && currentPath.includes('/register')) {
    return false;
  }

  return true;
};

export const validateTelegramData = (): { valid: boolean; data: any | null } => {
  try {
    const storedData = sessionStorage.getItem('telegram_auth_data');
    if (!storedData) {
      return { valid: false, data: null };
    }

    const data = JSON.parse(storedData);
    
    // Validate required fields
    if (!data.id || !data.first_name || !data.auth_date) {
      return { valid: false, data: null };
    }

    // Check if data is not too old (max 24 hours)
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds
    
    if (now - data.auth_date > maxAge) {
      sessionStorage.removeItem('telegram_auth_data');
      return { valid: false, data: null };
    }

    return { valid: true, data };
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    sessionStorage.removeItem('telegram_auth_data');
    return { valid: false, data: null };
  }
};