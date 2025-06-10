
import { useState, useCallback, useRef } from 'react';

interface UseSubmissionGuardProps {
  timeout?: number;
  onDuplicateSubmit?: () => void;
}

export const useSubmissionGuard = ({ 
  timeout = 5000, 
  onDuplicateSubmit 
}: UseSubmissionGuardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const guardedSubmit = useCallback(async (submitFunction: () => Promise<void>) => {
    if (isSubmitting) {
      onDuplicateSubmit?.();
      return;
    }

    setIsSubmitting(true);
    
    // Устанавливаем таймаут для автоматического сброса состояния
    timeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
    }, timeout);

    try {
      await submitFunction();
    } catch (error) {
      console.error('Submission error:', error);
      throw error;
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsSubmitting(false);
    }
  }, [isSubmitting, timeout, onDuplicateSubmit]);

  const canSubmit = !isSubmitting;

  return {
    guardedSubmit,
    canSubmit,
    isSubmitting
  };
};
