import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { allowedLocalesFor, isLanguageAllowed } from '@/utils/languageVisibility';

/**
 * Language provider that enforces language visibility rules and syncs with user profile
 * - Bengali (bn) is only available on homepage and for sellers
 * - All other users see Russian only
 * - Authenticated users get language from their profile
 */
const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();

  // Sync language from profile when user first loads or profile changes
  useEffect(() => {
    if (user && profile?.preferred_locale) {
      const profileLanguage = profile.preferred_locale as 'ru' | 'en' | 'bn';
      // Only change if it's different and allowed for this user/route
      if (profileLanguage !== language && 
          isLanguageAllowed(profileLanguage, profile.user_type || null, location.pathname)) {
        changeLanguage(profileLanguage);
      }
    }
  }, [user, profile?.preferred_locale, profile?.user_type, location.pathname]);

  useEffect(() => {
    // Check if current language is allowed for user role and route
    if (!isLanguageAllowed(language, profile?.user_type || null, location.pathname)) {
      // Force switch to Russian if language is not allowed
      changeLanguage('ru');
    }
    
    // Update HTML lang attribute for accessibility and SEO
    document.documentElement.lang = language;
  }, [profile?.user_type, location.pathname, language, changeLanguage]);

  return <>{children}</>;
};

export default LanguageProvider;