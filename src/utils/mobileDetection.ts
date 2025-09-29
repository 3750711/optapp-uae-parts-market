/**
 * Mobile device detection utilities
 */

// Detect mobile devices
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768;
};

// Detect touch capability
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 ||
         // @ts-ignore
         navigator.msMaxTouchPoints > 0;
};

// Detect iOS devices specifically
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Detect Android devices specifically
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
};

// Get screen size category
export const getScreenCategory = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Check if device has hover capability
export const hasHover = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  return window.matchMedia('(hover: hover)').matches;
};

// Optimized configuration getter for Cloudinary
export const getOptimizedConfig = () => {
  const mobile = isMobileDevice();
  const touch = isTouchDevice();
  const screenCategory = getScreenCategory();
  
  return {
    isMobile: mobile,
    isTouch: touch,
    screenCategory,
    buttonSize: mobile ? 'lg' : 'default',
    iconSize: mobile ? 'w-5 h-5' : 'w-4 h-4',
    textSize: mobile ? 'text-base' : 'text-sm',
    progressBarHeight: mobile ? 'h-3' : 'h-2',
    touchOptimization: touch
  };
};