/**
 * Применяет PWA-специфичные стили к виджету Cloudinary после его открытия
 * 
 * Проблема: Cloudinary Widget создаёт элементы динамически с inline-стилями,
 * которые перекрывают наши CSS правила. Решение - JavaScript-инжекция стилей
 * с максимальной специфичностью через setProperty(..., 'important')
 */

let observer: MutationObserver | null = null;

export const applyPWAWidgetStyles = () => {
  // Detect PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;
  
  if (!isPWA) {
    console.log('📱 Not in PWA mode, skipping widget style override');
    return;
  }

  console.log('🎨 Applying PWA-specific Cloudinary widget styles...');

  // Функция для применения стилей к элементам
  const applyStylesToElements = () => {
    // Find all possible widget containers
    const widgetIframes = document.querySelectorAll('iframe[id^="cloudinary-widget"]');
    const widgetDivs = document.querySelectorAll('div[id^="cloudinary-widget"]');
    const widgetWrappers = document.querySelectorAll('.cloudinary-widget-wrapper, [class*="cloudinary"]');

    // Apply styles to all found elements
    const allElements = [...widgetIframes, ...widgetDivs, ...widgetWrappers];
    
    if (allElements.length === 0) {
      console.log('⏳ Widget elements not found yet, will retry...');
      return false;
    }
    
    // Определяем доступную высоту с учетом safe-area (вынесено из цикла для debug логов)
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-top') || '0');
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-bottom') || '0');

    allElements.forEach((element: Element) => {
      const el = element as HTMLElement;
      
      // Skip if already styled
      if (el.dataset.pwaStyled === 'true') return;
      
      // Determine screen size
      const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 640;
      
      // Базовая высота: 75vh для маленьких экранов, 70vh для обычных
      const baseHeight = isSmallScreen ? 75 : 70;
      
      // Вычисляем максимальную высоту с учетом safe-area (в пикселях)
      const viewportHeight = window.innerHeight;
      const maxHeightPx = (viewportHeight * baseHeight / 100) - safeAreaTop - safeAreaBottom - 40; // -40px для отступов
      
      const maxWidth = isSmallScreen ? '95vw' : '90vw';
      const maxHeight = `${maxHeightPx}px`;
      
      // Центрируем с учетом safe-area
      const topOffset = safeAreaTop + 20; // +20px отступ от верхней safe-area
      
      // Force PWA-friendly size with !important
      el.style.setProperty('max-width', maxWidth, 'important');
      el.style.setProperty('max-height', maxHeight, 'important');
      el.style.setProperty('width', maxWidth, 'important');
      el.style.setProperty('height', 'auto', 'important'); // ✅ auto вместо фиксированной высоты
      el.style.setProperty('min-height', '50vh', 'important'); // ✅ минимальная высота
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('top', `${topOffset}px`, 'important');
      el.style.setProperty('left', '50%', 'important');
      el.style.setProperty('transform', 'translateX(-50%)', 'important'); // ✅ только горизонтальное центрирование
      el.style.setProperty('bottom', `max(20px, env(safe-area-inset-bottom, 20px))`, 'important'); // ✅ отступ от нижней safe-area
      el.style.setProperty('border-radius', '16px', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
      el.style.setProperty('overflow-y', 'auto', 'important'); // ✅ Скролл при необходимости
      el.style.setProperty('box-shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 'important');
      el.style.setProperty('z-index', '99999', 'important');
      
      // Mark as styled to prevent re-application
      el.dataset.pwaStyled = 'true';
      
      console.log('✅ Applied PWA styles to:', el.tagName, el.id || el.className);
    });

    // Find and style overlay
    const overlay = document.getElementById('cloudinary-overlay');
    if (overlay && overlay.dataset.pwaStyled !== 'true') {
      overlay.style.setProperty('background', 'rgba(0, 0, 0, 0.75)', 'important');
      overlay.style.setProperty('backdrop-filter', 'blur(4px)', 'important');
      overlay.style.setProperty('z-index', '99998', 'important');
      overlay.dataset.pwaStyled = 'true';
      console.log('✅ Applied PWA styles to overlay');
    }
    
    // Стилизация кнопки закрытия с учетом safe-area
    const applyCloseButtonStyles = () => {
      const closeButtons = document.querySelectorAll(
        '.cloudinary-widget [class*="close"], ' +
        '.cloudinary-widget button[aria-label*="close"], ' +
        '.cloudinary-widget button[title*="Close"]'
      );
      
      closeButtons.forEach((btn: Element) => {
        const el = btn as HTMLElement;
        if (el.dataset.pwaCloseStyled === 'true') return;
        
        el.style.setProperty('position', 'absolute', 'important');
        el.style.setProperty('top', '12px', 'important');
        el.style.setProperty('right', '12px', 'important');
        el.style.setProperty('width', '44px', 'important');
        el.style.setProperty('height', '44px', 'important');
        el.style.setProperty('z-index', '10001', 'important');
        el.style.setProperty('background', 'rgba(0, 0, 0, 0.8)', 'important');
        el.style.setProperty('color', 'white', 'important');
        el.style.setProperty('border-radius', '50%', 'important');
        el.style.setProperty('border', '2px solid white', 'important');
        el.style.setProperty('cursor', 'pointer', 'important');
        el.style.setProperty('display', 'flex', 'important');
        el.style.setProperty('align-items', 'center', 'important');
        el.style.setProperty('justify-content', 'center', 'important');
        
        el.dataset.pwaCloseStyled = 'true';
      });
    };
    
    // Вызвать после применения стилей к виджету
    setTimeout(() => applyCloseButtonStyles(), 300);
    setTimeout(() => applyCloseButtonStyles(), 600); // Retry для медленных устройств
    
    // Диагностика для отладки
    console.log('📐 Widget dimensions:', {
      viewportHeight: window.innerHeight,
      safeAreaTop,
      safeAreaBottom,
      appliedTo: allElements.length
    });

    console.log('✅ PWA widget styles applied to', allElements.length, 'elements');
    return true;
  };

  // Apply styles with multiple retries (widget DOM loads asynchronously)
  const applyWithRetries = (attempt = 1, maxAttempts = 10) => {
    const success = applyStylesToElements();
    
    if (!success && attempt < maxAttempts) {
      setTimeout(() => applyWithRetries(attempt + 1, maxAttempts), 100);
    }
  };

  // Initial application with retries
  applyWithRetries();

  // Monitor for new widgets using MutationObserver
  // This handles cases where widget is closed and reopened
  if (!observer) {
    observer = new MutationObserver((mutations) => {
      // Check if any iframe or widget element was added
      const widgetAdded = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => {
          if (node instanceof HTMLElement) {
            return (
              node.tagName === 'IFRAME' && 
              node.id?.startsWith('cloudinary-widget')
            ) || (
              node.id?.startsWith('cloudinary-widget') ||
              node.className?.includes('cloudinary')
            );
          }
          return false;
        })
      );

      if (widgetAdded) {
        console.log('🔄 Widget DOM changed, re-applying PWA styles...');
        applyStylesToElements();
      }
    });

    // Observe document.body for widget insertions
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    console.log('👀 MutationObserver started for Cloudinary widget');
  }
};

/**
 * Очистить MutationObserver при размонтировании компонента
 */
export const cleanupPWAWidgetObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('🧹 PWA widget observer cleaned up');
  }
};
