
import { useState, useCallback, useRef } from 'react';

interface SubmissionGuardConfig {
  timeout?: number;
  onDuplicateSubmit?: () => void;
}

export const useSubmissionGuard = (config: SubmissionGuardConfig = {}) => {
  const { timeout = 3000, onDuplicateSubmit } = config;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const guardedSubmit = useCallback(async (submitFn: () => Promise<void> | void) => {
    const now = Date.now();
    
    // Проверяем, не слишком ли быстро повторная отправка
    if (lastSubmitTime && (now - lastSubmitTime) < 1000) {
      onDuplicateSubmit?.();
      return;
    }

    if (isSubmitting) {
      onDuplicateSubmit?.();
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    // Устанавливаем таймаут для автоматического сброса
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
    }, timeout);

    try {
      await submitFn();
    } catch (error) {
      throw error;
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsSubmitting(false);
    }
  }, [isSubmitting, lastSubmitTime, timeout, onDuplicateSubmit]);

  const resetGuard = useCallback(() => {
    setIsSubmitting(false);
    setLastSubmitTime(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isSubmitting,
    guardedSubmit,
    resetGuard,
    canSubmit: !isSubmitting
  };
};
