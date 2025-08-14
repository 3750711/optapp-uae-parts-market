import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmbeddingsStats {
  totalProducts: number;
  embeddingsCount: number;
  activeProducts: number;
  soldProducts: number;
  activeEmbeddings: number;
  soldEmbeddings: number;
}

export const useEmbeddingsGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; updated: number; total: number } | null>(null);
  const [stats, setStats] = useState<EmbeddingsStats | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'sold']);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get active products count
      const { count: activeProducts, error: activeError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Get sold products count
      const { count: soldProducts, error: soldError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sold');

      if (soldError) throw soldError;

      // Get total embeddings count
      const { count: embeddingsCount, error: embeddingsError } = await supabase
        .from('product_embeddings')
        .select('*', { count: 'exact', head: true });

      if (embeddingsError) throw embeddingsError;

      // Get embeddings for active products
      const { count: activeEmbeddings, error: activeEmbeddingsError } = await supabase
        .from('product_embeddings')
        .select('product_id, products!inner(status)', { count: 'exact', head: true })
        .eq('products.status', 'active');

      if (activeEmbeddingsError) throw activeEmbeddingsError;

      // Get embeddings for sold products  
      const { count: soldEmbeddings, error: soldEmbeddingsError } = await supabase
        .from('product_embeddings')
        .select('product_id, products!inner(status)', { count: 'exact', head: true })
        .eq('products.status', 'sold');

      if (soldEmbeddingsError) throw soldEmbeddingsError;

      setStats({
        totalProducts: (activeProducts || 0) + (soldProducts || 0),
        embeddingsCount: embeddingsCount || 0,
        activeProducts: activeProducts || 0,
        soldProducts: soldProducts || 0,
        activeEmbeddings: activeEmbeddings || 0,
        soldEmbeddings: soldEmbeddings || 0
      });
    } catch (error) {
      console.error('Error fetching embeddings stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить статистику embeddings',
        variant: 'destructive',
      });
    }
  };

  const generateEmbeddings = async () => {
    if (!stats) {
      await fetchStats();
      return;
    }

    setIsGenerating(true);
    setProgress(null);

    try {
      console.log('🚀 Starting embeddings generation for statuses:', selectedStatuses);
      
      const batchSize = 50; // Smaller batch size for reliability
      let totalProcessed = 0;
      let totalUpdated = 0;
      let offset = 0;
      
      // Calculate total products to process based on selected statuses
      const totalToProcess = selectedStatuses.reduce((total, status) => {
        if (status === 'active') return total + stats.activeProducts;
        if (status === 'sold') return total + stats.soldProducts;
        return total;
      }, 0);

      setProgress({
        processed: 0,
        updated: 0,
        total: totalToProcess
      });

      console.log(`🎯 Target: ${totalToProcess} products with statuses:`, selectedStatuses);

      // Process in batches with pagination
      while (offset < totalToProcess) {
        console.log(`📦 Processing batch: offset ${offset}, batchSize ${batchSize}`);
        
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: {
            statuses: selectedStatuses,
            batchSize,
            offset
          }
        });

        if (error) {
          console.error('❌ Batch error:', error);
          throw error;
        }

        if (data) {
          totalProcessed += data.processed || 0;
          totalUpdated += data.updated || 0;
          
          // Update progress
          setProgress({
            processed: totalProcessed,
            updated: totalUpdated,
            total: totalToProcess
          });

          console.log(`✅ Batch completed: processed ${data.processed}, updated ${data.updated}. Total: ${totalProcessed}/${totalToProcess}`);
          
          // If we processed fewer items than batch size, we're done
          if ((data.processed || 0) < batchSize) {
            console.log('🏁 Reached end of data, stopping');
            break;
          }
          
          offset += batchSize;
          
          // Small delay between batches to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('⚠️ No data returned, stopping');
          break;
        }
      }

      toast({
        title: 'Успешно!',
        description: `Embeddings сгенерированы. Обработано: ${totalProcessed}, обновлено: ${totalUpdated}`,
      });

      // Refresh stats after generation
      await fetchStats();

    } catch (error: any) {
      console.error('❌ Error generating embeddings:', error);
      toast({
        title: 'Ошибка генерации embeddings',
        description: error.message || 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateEmbeddings,
    fetchStats,
    isGenerating,
    progress,
    stats,
    selectedStatuses,
    setSelectedStatuses
  };
};