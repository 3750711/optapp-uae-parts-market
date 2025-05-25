
import { useState, useEffect } from 'react';

interface AdminOrdersSettings {
  statusFilter: string;
  sortField: string;
  sortDirection: string;
  pageSize: number;
}

const DEFAULT_SETTINGS: AdminOrdersSettings = {
  statusFilter: 'all',
  sortField: 'created_at',
  sortDirection: 'desc',
  pageSize: 20
};

export const useLocalStorageSettings = (key: string) => {
  const [settings, setSettings] = useState<AdminOrdersSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, [key]);

  const updateSettings = (newSettings: Partial<AdminOrdersSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  };

  return { settings, updateSettings };
};
