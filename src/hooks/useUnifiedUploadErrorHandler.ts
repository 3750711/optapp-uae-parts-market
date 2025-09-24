import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UploadError {
  type: 'network' | 'abort' | 'timeout' | 'compression' | 'server' | 'unknown';
  message: string;
  fileName?: string;
  retryable: boolean;
  statusCode?: number;
}

interface ErrorHandlerOptions {
  disableToast?: boolean;
  customErrorMessages?: Record<string, string>;
}

export const useUnifiedUploadErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { toast } = useToast();

  // Classify error type and determine if retryable
  const classifyError = useCallback((error: any, fileName?: string): UploadError => {
    const message = error instanceof Error ? error.message : String(error);
    const statusCode = error?.status || error?.statusCode;

    // Abort errors
    if (error?.name === 'AbortError' || message.includes('abort') || message.includes('cancelled')) {
      return {
        type: 'abort',
        message: 'Загрузка отменена',
        fileName,
        retryable: false
      };
    }

    // Timeout errors
    if (message.includes('timeout') || statusCode === 408) {
      return {
        type: 'timeout',
        message: 'Превышено время ожидания',
        fileName,
        retryable: true,
        statusCode
      };
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || !navigator.onLine) {
      return {
        type: 'network',
        message: 'Ошибка сети',
        fileName,
        retryable: true
      };
    }

    // Compression errors
    if (message.includes('compression') || message.includes('compress')) {
      return {
        type: 'compression',
        message: 'Ошибка сжатия изображения',
        fileName,
        retryable: false
      };
    }

    // Server errors (5xx)
    if (statusCode && statusCode >= 500) {
      return {
        type: 'server',
        message: 'Ошибка сервера',
        fileName,
        retryable: true,
        statusCode
      };
    }

    // Client errors (4xx) - usually not retryable
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const nonRetryableCodes = [401, 403, 404, 413]; // Unauthorized, Forbidden, Not Found, Payload Too Large
      return {
        type: 'server',
        message: `Ошибка клиента (${statusCode})`,
        fileName,
        retryable: !nonRetryableCodes.includes(statusCode),
        statusCode
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      message: message || 'Неизвестная ошибка',
      fileName,
      retryable: true
    };
  }, []);

  // Handle single error
  const handleError = useCallback((
    error: any, 
    fileName?: string,
    context?: string
  ): UploadError => {
    const uploadError = classifyError(error, fileName);
    
    logger.error(`Upload error${context ? ` (${context})` : ''}:`, {
      type: uploadError.type,
      message: uploadError.message,
      fileName: uploadError.fileName,
      retryable: uploadError.retryable,
      originalError: error
    });

    // Show toast notification if not disabled
    if (!options.disableToast && uploadError.type !== 'abort') {
      const customMessage = options.customErrorMessages?.[uploadError.type];
      const displayMessage = customMessage || uploadError.message;
      
      toast({
        title: "Ошибка загрузки",
        description: uploadError.fileName 
          ? `${displayMessage}: ${uploadError.fileName}`
          : displayMessage,
        variant: "destructive",
      });
    }

    return uploadError;
  }, [classifyError, toast, options]);

  // Handle multiple errors with summary
  const handleMultipleErrors = useCallback((
    errors: Array<{ error: any; fileName?: string; context?: string }>,
    successCount: number = 0
  ) => {
    const processedErrors = errors.map(({ error, fileName, context }) => 
      handleError(error, fileName, context)
    );

    // Group errors by type for summary
    const errorGroups = processedErrors.reduce((groups, err) => {
      if (!groups[err.type]) {
        groups[err.type] = [];
      }
      groups[err.type].push(err);
      return groups;
    }, {} as Record<string, UploadError[]>);

    // Log summary
    logger.log('Upload batch completed:', {
      successful: successCount,
      failed: errors.length,
      errorTypes: Object.keys(errorGroups),
      details: errorGroups
    });

    // Show summary toast if not disabled
    if (!options.disableToast && errors.length > 0) {
      const totalFiles = successCount + errors.length;
      const abortedCount = errorGroups.abort?.length || 0;
      const realErrors = errors.length - abortedCount;

      if (realErrors > 0) {
        toast({
          title: "Результат загрузки",
          description: successCount > 0 
            ? `Загружено ${successCount} из ${totalFiles} файлов. ${realErrors} ошибок.`
            : `Не удалось загрузить ${realErrors} файлов`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      }
    }

    return processedErrors;
  }, [handleError, toast, options]);

  // Check if error is retryable
  const isRetryable = useCallback((error: any): boolean => {
    const uploadError = classifyError(error);
    return uploadError.retryable;
  }, [classifyError]);

  // Get retry delay based on attempt count and error type
  const getRetryDelay = useCallback((
    error: any, 
    attemptCount: number,
    baseDelay: number = 1000
  ): number => {
    const uploadError = classifyError(error);
    
    if (!uploadError.retryable) return 0;

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
    const jitter = Math.random() * 500; // 0-500ms jitter
    
    // Different delays for different error types
    switch (uploadError.type) {
      case 'network':
        return exponentialDelay + jitter;
      case 'timeout':
        return exponentialDelay * 1.5 + jitter; // Longer delay for timeouts
      case 'server':
        return exponentialDelay * 0.5 + jitter; // Shorter delay for server errors
      default:
        return exponentialDelay + jitter;
    }
  }, [classifyError]);

  return {
    handleError,
    handleMultipleErrors,
    classifyError,
    isRetryable,
    getRetryDelay
  };
};