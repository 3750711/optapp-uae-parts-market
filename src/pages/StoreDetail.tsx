
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Phone, Star, User, ShieldCheck, Package, Store as StoreIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreReview, StoreWithImages } from '@/types/store';
import WriteReviewDialog from '@/components/store/WriteReviewDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Запрос данных магазина
  const { data: store, isLoading: isStoreLoading, refetch } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as StoreWithImages;
    }
  });

  // Запрос объявлений продавца
  const { data: sellerProducts, isLoading: isProductsLoading } = useQuery({
    queryKey: ['seller-products', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, created_at, status')
        .eq('seller_id', store.seller_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!store?.seller_id
  });

  // Запрос отзывов
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['store-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_reviews')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('store_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(review => ({
        ...review,
        user_name: review.profiles?.full_name,
        user_avatar: review.profiles?.avatar_url
      })) as StoreReview[];
    }
  });

  const getMainImageUrl = () => {
    const primaryImage = store?.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store?.store_images?.[0]?.url || '/placeholder.svg';
  };

  const onReviewSubmitted = () => {
    refetch();
  };

  if (isStoreLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-96 w-full md:col-span-2" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Магазин не найден</h1>
            <p className="text-muted-foreground">Запрошенный магазин не существует или был удалён</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                {store.name}
                {/* Отображаем статус верификации */}
                {store.verified ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Проверено
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Не проверено
                  </Badge>
                )}
              </h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{store.rating?.toFixed(1) || '-'}</span>
                </div>
                <div className="mx-2">•</div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span>{store.address}</span>
                </div>
              </div>

              {store.tags && store.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {store.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="capitalize">
                      {tag.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Tabs defaultValue="about">
              <TabsList className="mb-4">
                <TabsTrigger value="about">О магазине</TabsTrigger>
                <TabsTrigger value="photos">Фото</TabsTrigger>
                <TabsTrigger value="products">Объявления</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4">
                {store.description && (
                  <div>
                    <h3 className="font-medium mb-2">Описание</h3>
                    <p className="text-muted-foreground">{store.description}</p>
                  </div>
                )}
                
                {store.phone && (
                  <div>
                    <h3 className="font-medium mb-2">Контакты</h3>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{store.phone}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos">
                {store.store_images && store.store_images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {store.store_images.map((image) => (
                      <div key={image.id} className="aspect-square overflow-hidden rounded-md">
                        <img 
                          src={image.url} 
                          alt={store.name} 
                          className="object-cover w-full h-full hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">У этого магазина пока нет фотографий</p>
                )}
              </TabsContent>

              {/* Новая вкладка для отображения объявлений продавца */}
              <TabsContent value="products">
                <div className="space-y-4">
                  {isProductsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : sellerProducts && sellerProducts.length > 0 ? (
                    <div>
                      <div className="space-y-3">
                        {sellerProducts.map((product) => (
                          <Card key={product.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <Link 
                                  to={`/product/${product.id}`} 
                                  className="font-medium hover:text-primary"
                                >
                                  {product.title}
                                </Link>
                                <div className="text-sm text-muted-foreground">
                                  Цена: {product.price} AED
                                </div>
                              </div>
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/product/${product.id}`}>
                                  Просмотреть
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="mt-6 text-right">
                        <Button asChild variant="outline">
                          <Link to={`/seller/${store.seller_id}`}>
                            <Package className="mr-2" />
                            Все объявления продавца
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="flex justify-center mb-4">
                        <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                      <h3 className="font-medium mb-2">У продавца пока нет объявлений</h3>
                      <p className="text-muted-foreground mb-6">Загляните позже, возможно здесь появятся новые товары</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  {user && (
                    <div className="mb-6">
                      <Button onClick={() => setIsReviewDialogOpen(true)}>
                        Написать отзыв
                      </Button>
                    </div>
                  )}

                  {isReviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={review.user_avatar} />
                                  <AvatarFallback>
                                    <User className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <span>{review.user_name || 'Пользователь'}</span>
                              </div>
                              <div className="flex items-center">
                                {Array.from({ length: review.rating || 0 }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          {review.comment && (
                            <CardContent>
                              <p>{review.comment}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">У этого магазина пока нет отзывов</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <div className="aspect-square overflow-hidden rounded-lg mb-4">
              <img
                src={getMainImageUrl()}
                alt={store.name}
                className="object-cover w-full h-full"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Адрес</h3>
                  <p className="text-muted-foreground">{store.address}</p>
                </div>

                {store.phone && (
                  <div>
                    <h3 className="font-medium mb-1">Телефон</h3>
                    <p className="text-muted-foreground">{store.phone}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-1">Статус</h3>
                  <p className="flex items-center">
                    {store.verified ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Проверено
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Не проверено
                      </Badge>
                    )}
                  </p>
                </div>

                <Separator />

                <div className="text-center mb-4">
                  <div className="font-medium">{reviews?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">отзывов</div>
                </div>

                {/* Добавляем кнопку для перехода к объявлениям продавца */}
                <Button asChild className="w-full">
                  <Link to={`/seller/${store.seller_id}`}>
                    <Package className="mr-2" />
                    Все объявления продавца
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <WriteReviewDialog 
        open={isReviewDialogOpen} 
        onOpenChange={setIsReviewDialogOpen} 
        storeId={store.id}
        onSubmitted={onReviewSubmitted}
      />
    </Layout>
  );
};

export default StoreDetail;
