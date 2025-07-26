import { useState, useEffect } from 'react';

const LANGUAGE_STORAGE_KEY = 'login-language';

export const useLanguage = (defaultLanguage: 'ru' | 'en' = 'ru') => {
  const [language, setLanguage] = useState<'ru' | 'en'>(() => {
    // Get saved language from localStorage or use default
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved as 'ru' | 'en') || defaultLanguage;
  });

  const changeLanguage = (newLanguage: 'ru' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
  };

  return {
    language,
    changeLanguage,
  };
};