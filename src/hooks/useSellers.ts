
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
  const { toast } = useToast();

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      console.log('📋 Загружаем продавцов...');
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, opt_id')
          .eq('user_type', 'seller')
          .order('full_name');

        if (error) {
          console.error("❌ Ошибка загрузки продавцов:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить список продавцов",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ Продавцы загружены:', {
          count: data?.length || 0,
          sellers: data?.map(s => ({ id: s.id, name: s.full_name, opt_id: s.opt_id }))
        });
        
        setSellers(data || []);
      } catch (error) {
        console.error("❌ Неожиданная ошибка при загрузке продавцов:", error);
        toast({
          title: "Ошибка",
          description: "Произошла неожиданная ошибка при загрузке продавцов",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellers();
  }, [toast]);

  // Сортируем продавцов по opt_id, затем по имени
  const sortedSellers = [...sellers].sort((a, b) => {
    const optIdA = a.opt_id || '';
    const optIdB = b.opt_id || '';
    return optIdA.localeCompare(optIdB) || a.full_name.localeCompare(b.full_name);
  });

  return {
    sellers: sortedSellers,
    isLoading
  };
};
