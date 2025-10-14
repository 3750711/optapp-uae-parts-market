/**
 * Детект PWA mode и safe-area support
 */
export const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top, 0px)')) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom, 0px)')) || 0,
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left, 0px)')) || 0,
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right, 0px)')) || 0,
  };
};

export const enableSafeAreaDebug = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-debug-safe-area', 'true');
    console.log('🔍 Safe Area Debug enabled:', getSafeAreaInsets());
  }
};
