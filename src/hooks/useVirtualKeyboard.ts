import { useState, useEffect, useCallback, useRef } from 'react';
import { createDebouncedViewportHandler } from '@/utils/mobileFormOptimizations';

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
  
  const debouncedHandlerRef = useRef<(() => void) | null>(null);

  const handleResize = useCallback(() => {
    if (!window.visualViewport) {
      // Fallback for browsers without Visual Viewport API
      const currentHeight = window.innerHeight;
      const storedHeight = keyboardState.viewportHeight;
      const isKeyboardVisible = currentHeight < storedHeight * 0.75;
      
      setKeyboardState(prev => ({
        isVisible: isKeyboardVisible,
        viewportHeight: currentHeight,
        keyboardHeight: isKeyboardVisible ? storedHeight - currentHeight : 0,
      }));
      return;
    }

    const viewport = window.visualViewport;
    const currentHeight = viewport.height;
    const windowHeight = window.innerHeight;
    const isKeyboardVisible = currentHeight < windowHeight * 0.8;
    
    setKeyboardState(prev => ({
      isVisible: isKeyboardVisible,
      viewportHeight: currentHeight,
      keyboardHeight: isKeyboardVisible ? windowHeight - currentHeight : 0,
    }));
  }, []);

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
        // Use auto scroll behavior on mobile to prevent janky animations
        element.scrollIntoView({
          behavior: 'auto',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150);
  }, [keyboardState.isVisible, keyboardState.keyboardHeight]);

  useEffect(() => {
    if (!debouncedHandlerRef.current) {
      debouncedHandlerRef.current = createDebouncedViewportHandler(handleResize, 100);
    }
    
    const debouncedHandler = debouncedHandlerRef.current;
    
    if (!window.visualViewport) {
      window.addEventListener('resize', debouncedHandler);
      return () => window.removeEventListener('resize', debouncedHandler);
    }

    const viewport = window.visualViewport;
    viewport.addEventListener('resize', debouncedHandler);
    
    return () => {
      viewport.removeEventListener('resize', debouncedHandler);
    };
  }, [handleResize]);

  return {
    ...keyboardState,
    scrollToActiveInput,
  };
};