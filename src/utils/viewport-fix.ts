// Универсальное решение проблемы viewport height на мобильных
export function setupViewportHeight() {
  const setViewportHeight = () => {
    // Получаем реальную высоту viewport
    const vh = window.innerHeight * 0.01;
    
    // Устанавливаем CSS переменную
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Дополнительная переменная для safe viewport
    const safeVh = Math.min(window.innerHeight, window.screen.height) * 0.01;
    document.documentElement.style.setProperty('--safe-vh', `${safeVh}px`);
  };
  
  // Начальная установка
  setViewportHeight();
  
  // Обновление при изменениях
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Для iOS Safari - обновление при скролле
  let ticking = false;
  const scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        setViewportHeight();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  
  // Возвращаем функцию очистки
  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
    window.removeEventListener('scroll', scrollHandler);
  };
}