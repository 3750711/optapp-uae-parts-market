
// Улучшенная функция debounce с отменой запросов
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  const debounced = (...args: Parameters<F>): void => {
    // Отменяем предыдущий запрос если он еще выполняется
    if (abortController) {
      abortController.abort();
    }

    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(() => {
      // Создаем новый AbortController для текущего запроса
      abortController = new AbortController();
      
      // Если функция возвращает Promise с поддержкой отмены
      const result = func(...args);
      if (result && typeof result.then === 'function') {
        result.catch((error: any) => {
          if (error.name !== 'AbortError') {
            console.warn('Debounced function error:', error);
          }
        });
      }
    }, waitFor);
  };

  // Добавляем метод для принудительной отмены
  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  return debounced;
}

// Улучшенная функция throttle с поддержкой отмены
export function throttle<F extends (...args: any[]) => any>(func: F, limit: number) {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number = 0;

  const throttled = (...args: Parameters<F>): void => {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };

  throttled.cancel = () => {
    if (lastFunc) {
      clearTimeout(lastFunc);
      lastFunc = null;
    }
    inThrottle = false;
  };

  return throttled;
}
