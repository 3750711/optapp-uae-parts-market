import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnrichmentResult {
  title_ru: string;
  brand: string | null;
  model: string | null;
  confidence: number;
  processing_time_ms?: number;
}

interface UseAIEnrichmentOptions {
  onSuccess?: (result: EnrichmentResult) => void;
  onError?: (error: Error) => void;
}

export const useAIEnrichment = (options: UseAIEnrichmentOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const enrichProduct = useCallback(async (params: {
    product_id?: string;
    title: string;
    brand?: string;
    model?: string;
    category?: string;
    image_url?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: enrichmentError } = await supabase.functions.invoke('ai-enrich-product', {
        body: params
      });

      if (enrichmentError) {
        throw new Error(enrichmentError.message || 'AI enrichment failed');
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'AI enrichment returned no data');
      }

      setResult(data);
      
      // Show success toast
      const confidencePercent = Math.round(data.confidence * 100);
      toast({
        title: `AI обработка завершена (${confidencePercent}%)`,
        description: confidencePercent >= 80 
          ? 'Высокая точность - рекомендуется принять изменения'
          : confidencePercent >= 60
          ? 'Средняя точность - проверьте изменения'
          : 'Низкая точность - требуется ручная проверка'
      });

      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      toast({
        title: 'Ошибка AI обработки',
        description: error.message,
        variant: 'destructive'
      });

      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, options.onSuccess, options.onError]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    enrichProduct,
    isLoading,
    result,
    error,
    reset,
    // Helper functions
    hasResult: !!result,
    isHighConfidence: result ? result.confidence >= 0.8 : false,
    isMediumConfidence: result ? result.confidence >= 0.6 && result.confidence < 0.8 : false,
    isLowConfidence: result ? result.confidence < 0.6 : false,
  };
};