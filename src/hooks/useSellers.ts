
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Seller {
  id: string;
  full_name: string;
  opt_id?: string;
}

export const useSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchSellers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔄 Fetching sellers...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, opt_id')
          .eq('user_type', 'seller')
          .order('full_name');

        if (!mounted) return;

        if (error) {
          console.error('❌ Error fetching sellers:', error);
          setError(error.message);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список продавцов",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ Sellers loaded:', data?.length || 0);
        
        // Сортируем продавцов по opt_id, затем по имени
        const sortedSellers = (data || []).sort((a, b) => {
          const optIdA = a.opt_id || '';
          const optIdB = b.opt_id || '';
          return optIdA.localeCompare(optIdB) || a.full_name.localeCompare(b.full_name);
        });
        
        setSellers(sortedSellers);
      } catch (err) {
        if (!mounted) return;
        
        console.error('❌ Unexpected error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(errorMessage);
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка при загрузке продавцов",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSellers();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .order('full_name');

      if (error) {
        setError(error.message);
        return;
      }

      const sortedSellers = (data || []).sort((a, b) => {
        const optIdA = a.opt_id || '';
        const optIdB = b.opt_id || '';
        return optIdA.localeCompare(optIdB) || a.full_name.localeCompare(b.full_name);
      });
      
      setSellers(sortedSellers);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sellers,
    isLoading,
    error,
    refetch
  };
};
