
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SubmissionGuardOptions {
  timeout?: number;
  onDuplicateSubmit?: () => void;
}

export const useSubmissionGuard = (options: SubmissionGuardOptions = {}) => {
  const { timeout = 4000, onDuplicateSubmit } = options;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);

  const guardedSubmit = useCallback(
    async (submitAction: () => Promise<void>) => {
      const now = Date.now();
      
      if (isSubmitting) {
        console.warn("Submission already in progress.");
        return;
      }

      if (now - lastSubmitTimeRef.current < timeout) {
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
      lastSubmitTimeRef.current = now;

      try {
        await submitAction();
      } catch (error) {
        console.error("Submission action failed:", error);
      } finally {
        // Короткая задержка для предотвращения мерцания UI
        setTimeout(() => setIsSubmitting(false), 500);
      }
    },
    [isSubmitting, timeout, onDuplicateSubmit, toast]
  );

  const canSubmit = !isSubmitting;

  return { isSubmitting, guardedSubmit, canSubmit };
};
