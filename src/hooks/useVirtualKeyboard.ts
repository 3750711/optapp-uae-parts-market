import { useState, useEffect, useCallback } from 'react';

interface VirtualKeyboardState {
  isVisible: boolean;
  viewportHeight: number;
  keyboardHeight: number;
}

export const useVirtualKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState<VirtualKeyboardState>({
    isVisible: false,
    viewportHeight: window.innerHeight,
    keyboardHeight: 0,
  });

  const handleResize = useCallback(() => {
    if (!window.visualViewport) {
      // Fallback for browsers without Visual Viewport API
      const currentHeight = window.innerHeight;
      const isKeyboardVisible = currentHeight < keyboardState.viewportHeight * 0.75;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        viewportHeight: currentHeight,
        keyboardHeight: isKeyboardVisible ? keyboardState.viewportHeight - currentHeight : 0,
      });
      return;
    }

    const viewport = window.visualViewport;
    const currentHeight = viewport.height;
    const windowHeight = window.innerHeight;
    const isKeyboardVisible = currentHeight < windowHeight * 0.8;
    
    setKeyboardState({
      isVisible: isKeyboardVisible,
      viewportHeight: currentHeight,
      keyboardHeight: isKeyboardVisible ? windowHeight - currentHeight : 0,
    });
  }, [keyboardState.viewportHeight]);

  const scrollToActiveInput = useCallback((inputElement?: HTMLElement) => {
    if (!keyboardState.isVisible) return;

    const element = inputElement || document.activeElement as HTMLElement;
    if (!element) return;

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const keyboardHeight = keyboardState.keyboardHeight;
      
      // Only scroll if the element is hidden behind keyboard
      if (rect.bottom > windowHeight - keyboardHeight - 50) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150);
  }, [keyboardState.isVisible, keyboardState.keyboardHeight]);

  useEffect(() => {
    if (!window.visualViewport) {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const viewport = window.visualViewport;
    viewport.addEventListener('resize', handleResize);
    
    return () => {
      viewport.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return {
    ...keyboardState,
    scrollToActiveInput,
  };
};