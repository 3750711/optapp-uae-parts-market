import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface SubmissionGuardOptions {
  timeout?: number;
  onDuplicateSubmit?: () => void;
}

export const useSubmissionGuard = (options: SubmissionGuardOptions = {}) => {
  const { timeout = 4000, onDuplicateSubmit } = options;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTime = useRef<number>(0);

  // Use a ref to get the latest isSubmitting value in the callback without making it a dependency.
  const isSubmittingRef = useRef(isSubmitting);
  
  useLayoutEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const guardedSubmit = useCallback(
    async (submitAction: () => Promise<void>) => {
      const now = Date.now();
      if (isSubmittingRef.current) {
        logger.warn("Submission in progress.");
        return;
      }

      if (now - lastSubmitTime.current < timeout) {
        if (onDuplicateSubmit) {
          onDuplicateSubmit();
        }
        toast({
          title: "Пожалуйста, подождите",
          description: `Вы можете отправлять форму не чаще, чем раз в ${timeout / 1000} секунды.`,
          variant: "default",
        });
        return;
      }

      setIsSubmitting(true);
      lastSubmitTime.current = now;

      try {
        await submitAction();
      } catch (error) {
        logger.error("Submission action failed:", error);
        // Errors should be handled inside submitAction, but we catch here as a fallback.
      } finally {
        // A short delay to prevent UI flickering on very fast submissions
        setTimeout(() => setIsSubmitting(false), 500);
      }
    },
    [timeout, onDuplicateSubmit, toast]
  );

  return { isSubmitting, guardedSubmit, canSubmit: !isSubmitting };
};
