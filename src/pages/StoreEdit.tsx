
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import StoreForm from '@/components/store/StoreForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { StoreWithImages } from '@/types/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const StoreEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: store, isLoading, isError } = useQuery({
    queryKey: ['store-edit', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*, store_images(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching store:', error);
        throw error;
      }
      
      return data as StoreWithImages;
    },
    enabled: !!id
  });
  
  // Check if the current user is the store owner
  React.useEffect(() => {
    if (store && user && store.seller_id !== user.id) {
      toast({
        title: "Доступ запрещен",
        description: "Вы не можете редактировать этот магазин",
        variant: "destructive"
      });
      navigate(`/store/${id}`);
    }
  }, [store, user, id, navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={() => navigate(`/store/${id}`)}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (isError || !store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xl text-red-600 mb-4">Ошибка при загрузке информации о магазине</p>
          <Button onClick={() => navigate(`/store/${id}`)}>
            Вернуться к магазину
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={() => navigate(`/store/${id}`)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">Редактирование магазина</h1>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <StoreForm 
            store={store} 
            onSuccess={() => {
              toast({
                title: "Успешно!",
                description: "Магазин обновлен",
              });
              navigate(`/store/${id}`);
            }} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default StoreEdit;
