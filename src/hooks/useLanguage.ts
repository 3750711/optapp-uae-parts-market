import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LANGUAGE_STORAGE_KEY = 'login-language';
const LANGUAGE_CHANGE_EVENT = 'language-change';

export const useLanguage = (defaultLanguage: 'ru' | 'en' | 'bn' = 'ru') => {
  const { user, profile, updateProfile } = useAuth();
  
  const [language, setLanguage] = useState<'ru' | 'en' | 'bn'>(() => {
    // Get saved language from localStorage or use default
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved as 'ru' | 'en' | 'bn') || defaultLanguage;
  });

  // Load language from user profile when authenticated
  useEffect(() => {
    if (user && profile && profile.preferred_locale) {
      const profileLanguage = profile.preferred_locale as 'ru' | 'en' | 'bn';
      if (profileLanguage !== language) {
        setLanguage(profileLanguage);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLanguage);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        setLanguage(e.newValue as 'ru' | 'en' | 'bn');
      }
    };

    // Listen for custom language change events (from same tab)
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail.language);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener);
    };
  }, []);

  const changeLanguage = async (newLanguage: 'ru' | 'en' | 'bn') => {
    setLanguage(newLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    
    // Save to user profile if authenticated
    if (user && profile && updateProfile) {
      try {
        await updateProfile({ preferred_locale: newLanguage });
      } catch (error) {
        console.error('Failed to save language preference to profile:', error);
      }
    }
    
    // Dispatch custom event to sync with other components
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, {
      detail: { language: newLanguage }
    }));
  };

  return {
    language,
    changeLanguage,
  };
};