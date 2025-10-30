import { useState, useEffect, useCallback } from 'react';
import { safeGetItem, safeSetItem } from '@/utils/localStorage';

interface ColumnWidths {
  [columnId: string]: number;
}

interface UseResizableColumnsReturn {
  columnWidths: ColumnWidths;
  handleResize: (columnId: string, width: number) => void;
  resetWidths: () => void;
}

/**
 * Хук для управления шириной столбцов таблицы с сохранением в localStorage
 * @param tableId - уникальный идентификатор таблицы для сохранения настроек
 * @param defaultWidths - объект с дефолтными ширинами столбцов
 * @returns объект с текущими ширинами и функциями для изменения
 */
export const useResizableColumns = (
  tableId: string,
  defaultWidths: ColumnWidths
): UseResizableColumnsReturn => {
  const storageKey = `table-columns-${tableId}`;

  // Загрузка сохранённых ширин из localStorage или использование дефолтных
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    const saved = safeGetItem<ColumnWidths>(storageKey, defaultWidths);
    // Проверяем, что все ключи из defaultWidths присутствуют в saved
    const hasAllKeys = Object.keys(defaultWidths).every(key => key in saved);
    return hasAllKeys ? saved : defaultWidths;
  });

  // Сохранение ширин в localStorage при каждом изменении
  useEffect(() => {
    safeSetItem(storageKey, columnWidths);
  }, [columnWidths, storageKey]);

  // Обработчик изменения ширины столбца
  const handleResize = useCallback((columnId: string, width: number) => {
    const minWidth = 10;
    const maxWidth = 800;
    const validatedWidth = Math.max(minWidth, Math.min(maxWidth, width));

    setColumnWidths(prev => ({
      ...prev,
      [columnId]: validatedWidth
    }));
  }, []);

  // Сброс ширин к дефолтным значениям
  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
    safeSetItem(storageKey, defaultWidths);
  }, [defaultWidths, storageKey]);

  return {
    columnWidths,
    handleResize,
    resetWidths
  };
};
