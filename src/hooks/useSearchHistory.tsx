
import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'catalog_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  brand?: string;
  model?: string;
}

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Загрузка истории из localStorage при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSearchHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Сохранение истории в localStorage
  const saveToStorage = useCallback((history: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, []);

  // Добавление нового поискового запроса
  const addToHistory = useCallback((query: string, brand?: string, model?: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      brand,
      model
    };

    setSearchHistory(prev => {
      // Удаляем дубликаты
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase().trim() ||
        item.brand !== brand ||
        item.model !== model
      );
      
      // Добавляем новый элемент в начало и ограничиваем количество
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Удаление элемента из истории
  const removeFromHistory = useCallback((index: number) => {
    setSearchHistory(prev => {
      const updated = prev.filter((_, i) => i !== index);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Очистка всей истории
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
};
