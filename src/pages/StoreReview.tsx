
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreWithImages } from '@/types/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500, {
    message: "Комментарий не может быть длиннее 500 символов"
  }).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const StoreReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });
  
  const { data: store, isLoading } = useQuery({
    queryKey: ['store-review', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required');
      
      const { data, error } = await supabase
        .from('stores')
        .select('name, id')
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
  
  const onSubmit = async (values: ReviewFormValues) => {
    if (!user || !id) return;
    
    try {
      const { error } = await supabase
        .from('store_reviews')
        .insert({
          store_id: id,
          user_id: user.id,
          rating: values.rating,
          comment: values.comment || null,
        });
      
      if (error) throw error;
      
      toast({
        title: "Успешно!",
        description: "Ваш отзыв добавлен",
      });
      
      navigate(`/store/${id}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить отзыв",
        variant: "destructive"
      });
    }
  };
  
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
          <h1 className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-40 inline-block" />
            ) : (
              `Отзыв о ${store?.name || 'магазине'}`
            )}
          </h1>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Ваша оценка</h3>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-3xl focus:outline-none"
                      onClick={() => form.setValue('rating', star)}
                    >
                      <span className={star <= form.watch('rating') ? 'text-yellow-500' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий (необязательно)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Поделитесь своими впечатлениями о магазине..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">Отправить отзыв</Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default StoreReview;
