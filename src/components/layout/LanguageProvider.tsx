import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { isLanguageAllowed, getDefaultLanguageFor } from '@/utils/languageVisibility';

/**
 * Language provider that enforces language visibility rules
 * - Bengali (bn) is only available on homepage and for sellers
 * - All other users see Russian only
 * - Language loading and profile sync is handled by useLanguage hook
 */
const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    // Only enforce language restrictions if current language is not allowed
    if (!isLanguageAllowed(language, profile?.user_type || null, location.pathname)) {
      // If user has a saved preferred_locale and it's allowed, use that
      if (profile?.preferred_locale && 
          isLanguageAllowed(profile.preferred_locale as 'ru' | 'en' | 'bn', profile.user_type || null, location.pathname)) {
        changeLanguage(profile.preferred_locale as 'ru' | 'en' | 'bn');
      } else {
        // Otherwise use default language for user role
        const defaultLang = getDefaultLanguageFor(profile?.user_type || null, location.pathname);
        changeLanguage(defaultLang);
      }
    }
    
    // Update HTML lang attribute for accessibility and SEO
    document.documentElement.lang = language;
  }, [profile?.user_type, profile?.preferred_locale, location.pathname, language, changeLanguage]);

  return <>{children}</>;
};

export default LanguageProvider;