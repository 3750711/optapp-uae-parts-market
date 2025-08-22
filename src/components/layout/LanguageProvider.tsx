import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { allowedLocalesFor, isLanguageAllowed } from '@/utils/languageVisibility';

/**
 * Language provider that enforces language visibility rules
 * - Bengali (bn) is only available on homepage and for sellers
 * - All other users see Russian only
 */
const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();

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