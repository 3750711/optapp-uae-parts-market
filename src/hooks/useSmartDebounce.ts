import { useState, useEffect, useRef, useCallback } from 'react';

interface SmartDebounceOptions {
  minDelay?: number;
  maxDelay?: number;
  adaptiveThreshold?: number; // characters per second to trigger adaptive delay
}

/**
 * Smart debounce hook that adapts delay based on typing speed
 * Fast typing = longer delay, slow typing = shorter delay
 */
export function useSmartDebounce<T>(
  value: T,
  options: SmartDebounceOptions = {}
): T {
  const {
    minDelay = 150,
    maxDelay = 800,
    adaptiveThreshold = 3, // chars per second
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const typingSpeedRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(Date.now());

  const calculateDelay = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Track typing speed (characters per second)
    if (timeSinceLastUpdate > 0) {
      typingSpeedRef.current.push(1000 / timeSinceLastUpdate);
      // Keep only last 5 measurements
      if (typingSpeedRef.current.length > 5) {
        typingSpeedRef.current.shift();
      }
    }

    // Calculate average typing speed
    const avgSpeed = typingSpeedRef.current.reduce((a, b) => a + b, 0) / typingSpeedRef.current.length;
    
    // Adaptive delay: faster typing = longer delay
    let adaptiveDelay = minDelay;
    if (avgSpeed > adaptiveThreshold) {
      const speedMultiplier = Math.min(avgSpeed / adaptiveThreshold, 4);
      adaptiveDelay = Math.min(minDelay * speedMultiplier, maxDelay);
    }

    lastUpdateRef.current = now;
    return Math.floor(adaptiveDelay);
  }, [minDelay, maxDelay, adaptiveThreshold]);

  useEffect(() => {
    const delay = calculateDelay();
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    
    return () => clearTimeout(handler);
  }, [value, calculateDelay]);

  return debouncedValue;
}

/**
 * Smart debounce specifically for API calls with cancel support
 */
export function useSmartAPIDebounce<T>(
  value: T,
  apiCall: (value: T, signal: AbortSignal) => Promise<void>,
  options: SmartDebounceOptions = {}
): {
  debouncedValue: T;
  isPending: boolean;
  cancel: () => void;
} {
  const debouncedValue = useSmartDebounce(value, options);
  const [isPending, setIsPending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedValue === value) return; // Skip if no change

    cancel(); // Cancel previous request
    setIsPending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    apiCall(debouncedValue, controller.signal)
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.warn('Smart debounce API call failed:', error);
        }
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          setIsPending(false);
          abortControllerRef.current = null;
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedValue, value, apiCall, cancel]);

  return { debouncedValue, isPending, cancel };
}
