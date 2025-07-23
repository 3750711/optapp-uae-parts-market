import { useCallback, useRef } from 'react';

interface ABTestConfig {
  debounceTime: number;
  maxReconnectAttempts: number;
  batchSize: number;
}

// A/B тест конфигурации
const AB_TEST_CONFIGS: Record<string, ABTestConfig> = {
  'control': {
    debounceTime: 200,
    maxReconnectAttempts: 3,
    batchSize: 10
  },
  'optimized': {
    debounceTime: 150,
    maxReconnectAttempts: 2,
    batchSize: 5
  }
};

// Простое определение варианта теста (можно заменить на более сложную логику)
const getTestVariant = (): string => {
  const hash = window.location.href.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash) % 2 === 0 ? 'control' : 'optimized';
};

export const useABTest = () => {
  const variantRef = useRef<string>(getTestVariant());
  const interactionsRef = useRef<Array<{ type: string; data: any; timestamp: number }>>([]);

  const getCurrentDebounceTime = useCallback(() => {
    const config = AB_TEST_CONFIGS[variantRef.current];
    return config?.debounceTime || 150;
  }, []);

  const getMaxReconnectAttempts = useCallback(() => {
    const config = AB_TEST_CONFIGS[variantRef.current];
    return config?.maxReconnectAttempts || 3;
  }, []);

  const getBatchSize = useCallback(() => {
    const config = AB_TEST_CONFIGS[variantRef.current];
    return config?.batchSize || 10;
  }, []);

  const recordInteraction = useCallback((type: string, data: any) => {
    const interaction = {
      type,
      data,
      timestamp: Date.now()
    };
    
    interactionsRef.current.push(interaction);
    
    // Keep only last 100 interactions
    if (interactionsRef.current.length > 100) {
      interactionsRef.current.shift();
    }
    
    // Log for debugging
    console.log('📊 A/B Test interaction:', {
      variant: variantRef.current,
      type,
      data,
      timestamp: new Date(interaction.timestamp).toLocaleTimeString()
    });
  }, []);

  const getTestData = useCallback(() => {
    return {
      variant: variantRef.current,
      config: AB_TEST_CONFIGS[variantRef.current],
      interactions: interactionsRef.current.slice(-20), // Last 20 interactions
      totalInteractions: interactionsRef.current.length
    };
  }, []);

  return {
    variant: variantRef.current,
    getCurrentDebounceTime,
    getMaxReconnectAttempts,
    getBatchSize,
    recordInteraction,
    getTestData
  };
};
