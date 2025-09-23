import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LANGUAGE_STORAGE_KEY = 'login-language';
const LANGUAGE_CHANGE_EVENT = 'language-change';

export const useLanguage = (defaultLanguage: 'ru' | 'en' | 'bn' = 'en') => {
  const { user, profile, updateProfile } = useAuth();
  
  const [language, setLanguage] = useState<'ru' | 'en' | 'bn'>(() => {
    // For unauthenticated users, use localStorage or default
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const initialLanguage = (saved as 'ru' | 'en' | 'bn') || defaultLanguage;
    console.log('🌐 useLanguage: Initial state for defaultLanguage:', defaultLanguage, 'saved:', saved, 'result:', initialLanguage);
    return initialLanguage;
  });

  // Load language from user profile when authenticated
  useEffect(() => {
    if (user && profile) {
      if (profile.preferred_locale) {
        // Use language from profile
        const profileLanguage = profile.preferred_locale as 'ru' | 'en' | 'bn';
        console.log('useLanguage: Setting language from profile:', profileLanguage, 'for user:', user.id);
        setLanguage(profileLanguage);
      } else {
        // If no preferred_locale, set default and save to profile
        console.log('useLanguage: No preferred_locale, setting default:', defaultLanguage);
        setLanguage(defaultLanguage);
        if (updateProfile) {
          updateProfile({ preferred_locale: defaultLanguage }).catch(error => 
            console.error('Failed to set default language in profile:', error)
          );
        }
      }
    } else if (!user) {
      // For unauthenticated users, use localStorage
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      console.log('useLanguage: Unauthenticated user, using localStorage:', saved || defaultLanguage);
      setLanguage((saved as 'ru' | 'en' | 'bn') || defaultLanguage);
    }
  }, [user, profile, profile?.preferred_locale, defaultLanguage, updateProfile]);

  useEffect(() => {
    // Only listen for storage/custom events for unauthenticated users
    // Authenticated users get language only from their profile
    if (!user) {
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
    }
  }, [user]);

  const changeLanguage = async (newLanguage: 'ru' | 'en' | 'bn') => {
    console.log('🌐 useLanguage: changeLanguage called with:', newLanguage, 'current:', language, 'user:', !!user);
    setLanguage(newLanguage);
    
    if (user && updateProfile) {
      // For authenticated users: save only to profile
      try {
        console.log('🌐 useLanguage: Saving language to profile:', newLanguage);
        await updateProfile({ preferred_locale: newLanguage });
      } catch (error) {
        console.error('Failed to save language preference to profile:', error);
      }
    } else {
      // For unauthenticated users: save to localStorage and dispatch event
      console.log('🌐 useLanguage: Saving language to localStorage and dispatching event:', newLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, {
        detail: { language: newLanguage }
      }));
    }
  };

  return {
    language,
    changeLanguage,
  };
};