
import { useState, useRef, useCallback } from 'react';

interface UseMediaGesturesProps {
  itemsLength: number;
  onNext: () => void;
  onPrev: () => void;
  onClose?: () => void;
  swipeThreshold?: number;
}

export const useMediaGestures = ({
  itemsLength,
  onNext,
  onPrev,
  onClose,
  swipeThreshold = 50
}: UseMediaGesturesProps) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    
    // Горизонтальный свайп должен быть больше вертикального для навигации
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > swipeThreshold && itemsLength > 1) {
        onNext();
      } else if (diffX < -swipeThreshold && itemsLength > 1) {
        onPrev();
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  }, [itemsLength, onNext, onPrev, swipeThreshold]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onNext();
        break;
    }
  }, [onNext, onPrev, onClose]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown
  };
};
