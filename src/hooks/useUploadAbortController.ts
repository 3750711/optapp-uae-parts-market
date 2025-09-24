import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

interface AbortControllerHookOptions {
  onAbort?: () => void;
  timeoutMs?: number;
}

export const useUploadAbortController = (options: AbortControllerHookOptions = {}) => {
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  // Create new AbortController
  const createController = useCallback(() => {
    // Abort previous controller if exists
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort();
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Create new controller
    const controller = new AbortController();
    controllerRef.current = controller;
    isActiveRef.current = true;

    // Set timeout if specified
    if (options.timeoutMs) {
      timeoutRef.current = setTimeout(() => {
        if (!controller.signal.aborted) {
          logger.log(`⏰ Upload timeout after ${options.timeoutMs}ms`);
          controller.abort();
        }
      }, options.timeoutMs);
    }

    // Listen for abort events
    controller.signal.addEventListener('abort', () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (options.onAbort) {
        options.onAbort();
      }
    });

    logger.log('🔧 New AbortController created');
    return controller;
  }, [options]);

  // Get current controller or create new one
  const getController = useCallback(() => {
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      return createController();
    }
    return controllerRef.current;
  }, [createController]);

  // Get current signal
  const getSignal = useCallback(() => {
    return getController().signal;
  }, [getController]);

  // Check if operation is aborted
  const isAborted = useCallback(() => {
    return controllerRef.current?.signal.aborted ?? false;
  }, []);

  // Manual abort
  const abort = useCallback((reason?: string) => {
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      logger.log(`🛑 Manual abort${reason ? `: ${reason}` : ''}`);
      controllerRef.current.abort();
    }
  }, []);

  // Reset controller state
  const reset = useCallback(() => {
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort();
    }
    controllerRef.current = null;
    isActiveRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    logger.log('🔄 AbortController reset');
  }, []);

  // Check if controller is active
  const isActive = useCallback(() => {
    return isActiveRef.current && !isAborted();
  }, [isAborted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current && !controllerRef.current.signal.aborted) {
        logger.log('🛑 Component unmounting - aborting controller');
        controllerRef.current.abort();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    createController,
    getController,
    getSignal,
    abort,
    reset,
    isAborted,
    isActive,
    signal: controllerRef.current?.signal
  };
};