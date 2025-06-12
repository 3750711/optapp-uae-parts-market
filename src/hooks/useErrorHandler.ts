
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessage?: string;
  reportToMonitoring?: boolean;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage,
      reportToMonitoring = false,
    } = options;

    let errorMessage = 'Произошла неизвестная ошибка';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message);
    }

    if (logError) {
      console.error('Error handled:', error);
    }

    if (showToast) {
      toast({
        title: "Ошибка",
        description: customMessage || errorMessage,
        variant: "destructive",
      });
    }

    return {
      message: errorMessage,
      originalError: error,
    };
  }, [toast]);

  return {
    handleError,
  };
};
