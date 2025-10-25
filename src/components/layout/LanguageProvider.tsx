import React, { useEffect, useRef } from 'react';
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
  const lastAppliedLanguage = useRef<string | null>(null);

  useEffect(() => {
    const userType = profile?.user_type ?? null;
    const preferredLocale = profile?.preferred_locale as 'ru' | 'en' | 'bn' | undefined;
    const currentLanguage = language || preferredLocale || 'ru';
    
    // Skip if we already processed this language
    if (lastAppliedLanguage.current === currentLanguage) {
      return;
    }
    
    console.log('LanguageProvider: Checking language restrictions', {
      currentLanguage,
      preferredLocale,
      userType,
      pathname: location.pathname
    });
    
    // Force Russian for buyers
    if (userType === 'buyer' && currentLanguage !== 'ru') {
      console.log('LanguageProvider: Forcing Russian for buyer');
      if (language !== 'ru') { // Guard: only call if different
        changeLanguage('ru');
        lastAppliedLanguage.current = 'ru';
      }
      return;
    }
    
    // Check if current language is allowed
    let allowed = true;
    try {
      allowed = isLanguageAllowed(currentLanguage, userType, location.pathname);
    } catch (error) {
      console.warn('LanguageProvider: Error checking language allowed', error);
      allowed = true;
    }
    
    if (!allowed) {
      // Try preferred_locale if available and allowed
      if (preferredLocale) {
        try {
          const preferredAllowed = isLanguageAllowed(preferredLocale, userType, location.pathname);
          if (preferredAllowed && language !== preferredLocale) { // Guard
            console.log('LanguageProvider: Using preferred_locale:', preferredLocale);
            changeLanguage(preferredLocale);
            lastAppliedLanguage.current = preferredLocale;
            return;
          }
        } catch (error) {
          console.warn('LanguageProvider: Error with preferred_locale', error);
        }
      }
      
      // Otherwise use default for role
      try {
        const defaultLang = getDefaultLanguageFor(userType, location.pathname);
        if (language !== defaultLang) { // Guard
          console.log('LanguageProvider: Using default language:', defaultLang);
          changeLanguage(defaultLang);
          lastAppliedLanguage.current = defaultLang;
        }
      } catch (error) {
        console.warn('LanguageProvider: Error getting default language', error);
        if (language !== 'ru') {
          changeLanguage('ru');
          lastAppliedLanguage.current = 'ru';
        }
      }
    }
    
    // Mark language as applied and update HTML lang attribute
    lastAppliedLanguage.current = currentLanguage;
    document.documentElement.lang = currentLanguage;
  }, [profile?.user_type, profile?.preferred_locale, location.pathname, language, changeLanguage]);

  return <>{children}</>;
};

export default LanguageProvider;