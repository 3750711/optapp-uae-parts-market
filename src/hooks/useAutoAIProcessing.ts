import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoAIProcessingOptions {
  enabled?: boolean;
  checkInterval?: number; // in seconds
  maxRetries?: number;
}

interface ProductAIStatus {
  id: string;
  title: string;
  ai_enriched_at?: string;
  ai_confidence?: number;
  created_at: string;
}

export const useAutoAIProcessing = (options: AutoAIProcessingOptions = {}) => {
  const {
    enabled = true,
    checkInterval = 30, // 30 seconds
    maxRetries = 3
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<ProductAIStatus[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const { toast } = useToast();

  // Fetch products that need AI processing
  const fetchPendingProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, ai_enriched_at, ai_confidence, created_at')
        .is('ai_enriched_at', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching pending products:', error);
        return;
      }

      setPendingProducts(data || []);
    } catch (error) {
      console.error('Error in fetchPendingProducts:', error);
    }
  }, []);

  // Process a single product with AI
  const processProduct = useCallback(async (product: ProductAIStatus, retryCount = 0): Promise<boolean> => {
    try {
      console.log(`🤖 Auto-processing product ${product.id}: "${product.title}"`);

      const { data, error } = await supabase.functions.invoke('ai-enrich-product', {
        body: {
          product_id: product.id,
          title: product.title,
          auto_trigger: true
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.confidence) {
        console.log(`✅ Auto-processed ${product.id} with confidence ${data.confidence}`);
        setProcessedCount(prev => prev + 1);
        return true;
      }

      throw new Error('No valid response from AI service');
    } catch (error) {
      console.error(`❌ Auto-processing failed for ${product.id}:`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying ${product.id} (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        return processProduct(product, retryCount + 1);
      }

      setFailedCount(prev => prev + 1);
      return false;
    }
  }, [maxRetries]);

  // Process all pending products
  const processAllPending = useCallback(async () => {
    if (!enabled || isProcessing || pendingProducts.length === 0) {
      return;
    }

    setIsProcessing(true);
    console.log(`🚀 Starting auto-processing of ${pendingProducts.length} products`);

    try {
      const results = await Promise.allSettled(
        pendingProducts.map(product => processProduct(product))
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      if (successCount > 0) {
        toast({
          title: '🤖 AI автообработка завершена',
          description: `Обработано: ${successCount} товаров из ${pendingProducts.length}`
        });
      }

      // Refresh pending products list
      await fetchPendingProducts();
    } catch (error) {
      console.error('Error in processAllPending:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, isProcessing, pendingProducts, processProduct, fetchPendingProducts, toast]);

  // Manual trigger for single product
  const triggerProductProcessing = useCallback(async (productId: string) => {
    const product = pendingProducts.find(p => p.id === productId);
    if (!product) return;

    setIsProcessing(true);
    try {
      const success = await processProduct(product);
      if (success) {
        // Remove from pending list
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        toast({
          title: '✅ AI обработка завершена',
          description: 'Товар успешно обработан'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [pendingProducts, processProduct, toast]);

  // Set up polling for new products
  useEffect(() => {
    if (!enabled) return;

    fetchPendingProducts();

    const interval = setInterval(() => {
      fetchPendingProducts();
    }, checkInterval * 1000);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, fetchPendingProducts]);

  // Auto-process when new pending products are found
  useEffect(() => {
    if (enabled && pendingProducts.length > 0 && !isProcessing) {
      // Add a small delay to batch multiple products
      const timeout = setTimeout(processAllPending, 2000);
      return () => clearTimeout(timeout);
    }
  }, [enabled, pendingProducts.length, isProcessing, processAllPending]);

  // Reset counters periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setProcessedCount(0);
      setFailedCount(0);
    }, 300000); // Reset every 5 minutes

    return () => clearInterval(resetInterval);
  }, []);

  return {
    isProcessing,
    pendingProducts,
    processedCount,
    failedCount,
    triggerProductProcessing,
    fetchPendingProducts,
    // Statistics
    totalPending: pendingProducts.length,
    isEnabled: enabled,
    stats: {
      processed: processedCount,
      failed: failedCount,
      pending: pendingProducts.length
    }
  };
};