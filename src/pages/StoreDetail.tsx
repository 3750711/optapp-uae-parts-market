import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import WriteReviewDialog from '@/components/store/WriteReviewDialog';

interface StoreReview {
  id: string;
  created_at: string;
  rating: number;
  comment: string | null;
  user_id: string;
  user_name: string;
}

const StoreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: store, isLoading: isStoreLoading, error: storeError } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(url),
          profiles (full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews, isLoading: isReviewsLoading, error: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['storeReviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_reviews')
        .select(`
          *,
          profiles (full_name)
        `)
        .eq('store_id', id);

      if (error) throw error;
      return data as StoreReview[];
    },
    enabled: !!id,
  });

  const handleReviewSubmit = () => {
    refetchReviews();
  };

  if (isStoreLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (storeError || !store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Магазин не найден</CardTitle>
              <CardDescription>Запрашиваемый магазин не существует или был удален</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{store.name}</CardTitle>
            <CardDescription>{store.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                {store.profiles?.avatar_url ? (
                  <AvatarImage src={store.profiles.avatar_url} alt={store.profiles.full_name} />
                ) : (
                  <AvatarFallback>{store.profiles?.full_name?.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="text-lg font-semibold">{store.profiles?.full_name}</div>
                <Link to={`/public-seller-profile/${store.seller_id}`} className="text-sm text-blue-500 hover:underline">
                  Профиль продавца
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Отзывы</h3>
              {isReviewsLoading ? (
                <p>Загрузка отзывов...</p>
              ) : reviewsError ? (
                <p>Ошибка при загрузке отзывов.</p>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-2">
                  {reviews.map((review) => (
                    <Card key={review.id} className="bg-gray-50 border">
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{review.profiles?.full_name}</div>
                          <div className="flex items-center">
                            {renderRatingStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{review.comment}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>Пока нет отзывов.</p>
              )}
            </div>

            {user && (
              <Button onClick={() => setIsReviewDialogOpen(true)}>Написать отзыв</Button>
            )}
          </CardContent>
        </Card>
      </div>

      <WriteReviewDialog
        storeId={id || ''}
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onSubmitted={handleReviewSubmit}
      />
    </Layout>
  );
};

export default StoreDetail;
