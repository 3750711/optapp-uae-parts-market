import { useState, useEffect } from 'react';

export function useIsMobileEnhanced() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      // Проверка touch возможностей
      const hasTouch = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0 ||
                       (navigator as any).msMaxTouchPoints > 0;
      
      // Проверка user agent
      const mobileUserAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
        navigator.userAgent
      );
      
      // Проверка размера экрана
      const smallScreen = window.innerWidth <= 768;
      
      // Проверка ориентации (портрет на touch устройстве)
      const isPortrait = window.innerHeight > window.innerWidth * 1.2;
      
      // Комплексное решение
      const mobile = (hasTouch && mobileUserAgent) || 
                     smallScreen || 
                     (hasTouch && isPortrait);
      
      setIsMobile(mobile);
    };
    
    checkMobile();
    
    // Слушатели событий
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    // Очистка
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);
  
  return isMobile;
}

// Экспорт для обратной совместимости
export const useIsMobile = useIsMobileEnhanced;