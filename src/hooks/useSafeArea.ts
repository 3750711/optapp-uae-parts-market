import { useEffect, useState } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect PWA mode
    const checkPWA = () => {
      const isPWAMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-ignore
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsPWA(isPWAMode);
    };

    // Get safe area insets
    const getSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      const parseInset = (value: string) => {
        const parsed = parseInt(value.replace('px', ''));
        return isNaN(parsed) ? 0 : parsed;
      };

      setInsets({
        top: parseInset(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0,
        bottom: parseInset(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0,
        left: parseInset(computedStyle.getPropertyValue('--safe-area-inset-left')) || 0,
        right: parseInset(computedStyle.getPropertyValue('--safe-area-inset-right')) || 0,
      });
    };

    checkPWA();
    getSafeAreaInsets();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      checkPWA();
      getSafeAreaInsets();
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    insets,
    isPWA,
    // Helper для inline styles
    getBottomPadding: () => isPWA ? Math.max(16, insets.bottom) : 20,
  };
};
