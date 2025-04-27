
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StoreWithImages, StoreReview } from '@/types/store';
import { StarIcon, MapPin, Phone, ChevronLeft, Edit, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const StoreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: store, isLoading, isError, refetch } = useQuery({
    queryKey: ['store', id],
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
  
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['store-reviews', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required');
      
      const { data, error } = await supabase
        .from('store_reviews')
        .select('*, profiles:user_id(full_name)')
        .eq('store_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }
      
      return data.map(review => ({
        ...review,
        user_name: review.profiles?.full_name || 'Пользователь'
      })) as StoreReview[];
    },
    enabled: !!id
  });
  
  const isOwner = store && user && store.seller_id === user.id;
  
  const handleEdit = () => {
    navigate(`/store/edit/${id}`);
  };
  
  const handleDelete = async () => {
    if (!id || !confirm('Вы уверены, что хотите удалить этот магазин?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Успешно!",
        description: "Магазин удален",
      });
      
      navigate('/stores');
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить магазин",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={() => navigate('/stores')}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <Skeleton className="h-[300px] w-full" />
            <div className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-4 w-2/3" />
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
          <Button onClick={() => navigate('/stores')}>
            Вернуться к списку магазинов
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Find the primary image or use the first one
  const primaryImage = store.store_images?.find(img => img.is_primary);
  const displayImage = primaryImage?.url || 
                     store.store_images?.[0]?.url || 
                     'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=500&auto=format&fit=crop';
  
  const storeImages = store.store_images || [];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={() => navigate('/stores')}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
            <h1 className="text-2xl font-bold">{store.name}</h1>
          </div>
          
          {isOwner && (
            <div className="flex mt-4 md:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-2 flex items-center"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-1" /> Редактировать
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="flex items-center"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-1" /> Удалить
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="relative h-[300px]">
            <img 
              src={displayImage}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            {store.rating > 0 && (
              <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1 flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="font-medium">{store.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{store.name}</h2>
            
            {store.description && (
              <p className="text-gray-700 mb-6">{store.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  <span>{store.address}</span>
                </div>
                
                {store.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{store.phone}</span>
                  </div>
                )}
              </div>
              
              {store.tags && store.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Категории:</h3>
                  <div className="flex flex-wrap gap-2">
                    {store.tags.map((tag, index) => (
                      <Badge key={index} className="text-sm py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {storeImages.length > 1 && (
              <div className="mt-8">
                <h3 className="font-medium mb-3">Фотографии магазина:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {storeImages.map((image) => (
                    <div key={image.id} className="aspect-square rounded overflow-hidden">
                      <img 
                        src={image.url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Отзывы</h3>
          
          {isReviewsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center mb-3">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between mb-3">
                    <div className="font-medium">{review.user_name}</div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-700">{review.comment}</p>}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-500">У этого магазина пока нет отзывов</p>
            </div>
          )}
          
          {user && (
            <div className="mt-6">
              <Button 
                onClick={() => navigate(`/store/${id}/review`)}
                className="w-full sm:w-auto"
              >
                Оставить отзыв
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StoreDetail;
