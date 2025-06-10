
import { useState, useEffect } from 'react';

interface BaseSettings {
  [key: string]: any;
}

const defaultSettings: BaseSettings = {
  pageSize: 10,
  statusFilter: 'all',
  sortField: 'created_at',
  sortDirection: 'desc'
};

export const useLocalStorageSettings = <T extends BaseSettings>(
  key: string,
  initialSettings?: Partial<T>
) => {
  const [settings, setSettings] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        return { ...defaultSettings, ...initialSettings, ...parsedSettings } as T;
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
    return { ...defaultSettings, ...initialSettings } as T;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [key, settings]);

  const updateSettings = (updates: Partial<T>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings({ ...defaultSettings, ...initialSettings } as T);
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
};
