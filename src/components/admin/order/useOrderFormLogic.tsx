
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';

export const useOrderFormLogic = () => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]);

  const form = useForm({
    defaultValues: {
      seller_id: '',
      buyer_id: '',
      product_name: '',
      quantity: 1,
      price: '',
      status: 'pending'
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;

      const sellerProfiles = profiles?.filter(p => p.user_type === 'seller') || [];
      const buyerProfiles = profiles?.filter(p => p.user_type === 'buyer') || [];

      setSellers(sellerProfiles);
      setBuyers(buyerProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: any) => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          ...data,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Заказ создан",
        description: "Заказ успешно создан",
      });

      form.reset();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading,
    sellers,
    buyers,
    isAdmin
  };
};
