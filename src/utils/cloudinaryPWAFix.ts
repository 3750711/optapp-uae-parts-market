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

    allElements.forEach((element: Element) => {
      const el = element as HTMLElement;
      
      // Skip if already styled
      if (el.dataset.pwaStyled === 'true') return;
      
      // Determine screen size
      const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 640;
      const maxWidth = isSmallScreen ? '95vw' : '90vw';
      const maxHeight = isSmallScreen ? '75vh' : '70vh';
      
      // Force PWA-friendly size with !important
      el.style.setProperty('max-width', maxWidth, 'important');
      el.style.setProperty('max-height', maxHeight, 'important');
      el.style.setProperty('width', maxWidth, 'important');
      el.style.setProperty('height', maxHeight, 'important');
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('top', '50%', 'important');
      el.style.setProperty('left', '50%', 'important');
      el.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
      el.style.setProperty('border-radius', '16px', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
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
