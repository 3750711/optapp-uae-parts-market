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
    const safeLanguage = (language || profile?.preferred_locale || 'ru') as 'ru' | 'en' | 'bn';
    const userType = profile?.user_type ?? null;
    
    console.log('LanguageProvider: Checking language restrictions', {
      currentLanguage: safeLanguage,
      userType,
      preferredLocale: profile?.preferred_locale,
      pathname: location.pathname
    });
    
    // Force Russian language for buyers regardless of database value
    if (userType === 'buyer' && safeLanguage !== 'ru') {
      console.log('LanguageProvider: Forcing Russian for buyer user type');
      changeLanguage('ru');
      return;
    }
    
    // Safe language restriction check with fallback
    let allowed = true;
    try {
      allowed = isLanguageAllowed(safeLanguage, userType, location.pathname);
    } catch (error) {
      console.warn('LanguageProvider: Error checking language allowed, defaulting to allowed=true', error);
      allowed = true;
    }
    
    if (!allowed) {
      // If user has a saved preferred_locale and it's allowed, use that
      if (profile?.preferred_locale) {
        try {
          const preferredAllowed = isLanguageAllowed(profile.preferred_locale as 'ru' | 'en' | 'bn', userType, location.pathname);
          if (preferredAllowed) {
            console.log('LanguageProvider: Using profile preferred_locale:', profile.preferred_locale);
            changeLanguage(profile.preferred_locale as 'ru' | 'en' | 'bn');
            return;
          }
        } catch (error) {
          console.warn('LanguageProvider: Error checking preferred language, using default', error);
        }
      }
      
      // Otherwise use default language for user role
      try {
        const defaultLang = getDefaultLanguageFor(userType, location.pathname);
        console.log('LanguageProvider: Using default language for role:', defaultLang);
        changeLanguage(defaultLang);
      } catch (error) {
        console.warn('LanguageProvider: Error getting default language, using ru', error);
        changeLanguage('ru');
      }
    }
    
    // Update HTML lang attribute for accessibility and SEO (guaranteed safe)
    document.documentElement.lang = safeLanguage;
  }, [profile?.user_type, profile?.preferred_locale, location.pathname, language, changeLanguage]);

  // Force language update when profile.preferred_locale changes
  useEffect(() => {
    const safePreferredLocale = profile?.preferred_locale as 'ru' | 'en' | 'bn' | undefined;
    const userType = profile?.user_type ?? null;
    
    if (safePreferredLocale && language !== safePreferredLocale) {
      try {
        const allowed = isLanguageAllowed(safePreferredLocale, userType, location.pathname);
        if (allowed) {
          console.log('LanguageProvider: Profile preferred_locale changed, forcing update:', safePreferredLocale);
          changeLanguage(safePreferredLocale);
        }
      } catch (error) {
        console.warn('LanguageProvider: Error processing preferred_locale change', error);
      }
    }
  }, [profile?.preferred_locale, language, profile?.user_type, location.pathname, changeLanguage]);

  return <>{children}</>;
};

export default LanguageProvider;