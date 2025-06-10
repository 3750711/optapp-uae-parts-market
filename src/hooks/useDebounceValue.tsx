
import { useState, useEffect } from 'react';

/**
 * Хук для создания дебаунсированного значения
 * @param value Исходное значение
 * @param delay Задержка в миллисекундах
 * @returns Дебаунсированное значение
 */
export function useDebounceValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления дебаунсированного значения
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при изменении входного значения
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounceValue;
