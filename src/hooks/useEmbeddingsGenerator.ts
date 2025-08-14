import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmbeddingsStats {
  totalProducts: number;
  embeddingsCount: number;
}

export const useEmbeddingsGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; updated: number } | null>(null);
  const [stats, setStats] = useState<EmbeddingsStats | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get total active products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (productsError) throw productsError;

      // Get embeddings count
      const { count: embeddingsCount, error: embeddingsError } = await supabase
        .from('product_embeddings')
        .select('*', { count: 'exact', head: true });

      if (embeddingsError) throw embeddingsError;

      setStats({
        totalProducts: totalProducts || 0,
        embeddingsCount: embeddingsCount || 0
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
    setIsGenerating(true);
    setProgress(null);

    try {
      console.log('🚀 Starting embeddings generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          batchSize: 50
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Embeddings generation completed:', data);
      
      if (data) {
        setProgress({
          processed: data.processedCount || 0,
          updated: data.updatedCount || 0
        });
      }

      toast({
        title: 'Успешно!',
        description: `Embeddings сгенерированы. Обработано: ${data?.processedCount || 0}, обновлено: ${data?.updatedCount || 0}`,
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
    stats
  };
};