import { Database } from '@/integrations/supabase/types';

type UserType = Database['public']['Tables']['profiles']['Row']['user_type'];

/**
 * Determines which languages are allowed for a specific user role and route
 * @param userRole - Current user's role
 * @param pathname - Current route pathname
 * @returns Array of allowed language codes
 */
export function allowedLocalesFor(
  userRole: UserType | null,
  pathname: string
): ('ru' | 'en' | 'bn')[] {
  const isHome = pathname === '/' || pathname.startsWith('/home');
  const isSellerRoute = pathname.startsWith('/seller/');
  const isPublicProfile = pathname.startsWith('/public-profile/');
  
  // Bengali is only available on home page, for sellers, and public profiles
  if (userRole === 'seller' || isHome || isSellerRoute || isPublicProfile) {
    return ['ru', 'en', 'bn'];
  }
  
  // All other users (buyers, admin, etc.) only see Russian
  return ['ru'];
}

/**
 * Checks if the current language is allowed for the user role and route
 * @param language - Current language
 * @param userRole - Current user's role
 * @param pathname - Current route pathname
 * @returns Whether the language is allowed
 */
export function isLanguageAllowed(
  language: 'ru' | 'en' | 'bn',
  userRole: UserType | null,
  pathname: string
): boolean {
  const allowedLocales = allowedLocalesFor(userRole, pathname);
  return allowedLocales.includes(language);
}

/**
 * Gets the default language for a user role and route
 * @param userRole - Current user's role
 * @param pathname - Current route pathname
 * @returns Default language code
 */
export function getDefaultLanguageFor(
  userRole: UserType | null,
  pathname: string
): 'ru' | 'en' | 'bn' {
  const allowedLocales = allowedLocalesFor(userRole, pathname);
  const isPublicProfile = pathname.startsWith('/public-profile/');
  
  // For sellers and public profiles, default to English
  if ((userRole === 'seller' || isPublicProfile) && allowedLocales.includes('en')) {
    return 'en';
  }
  
  // Otherwise default to Russian
  return 'ru';
}
