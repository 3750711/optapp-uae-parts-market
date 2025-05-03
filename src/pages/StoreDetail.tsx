
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Phone, Star, User, ShieldCheck, Package, Store as StoreIcon, Image, MessageSquare, Send, MessageCircle, ChevronLeft, Car, CarFront, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreReview, StoreWithImages } from '@/types/store';
import WriteReviewDialog from '@/components/store/WriteReviewDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Store data query
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

  // Car brands and models query
  const { data: carBrandsData, isLoading: isBrandsLoading } = useQuery({
    queryKey: ['store-car-brands', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data: brandData, error: brandError } = await supabase
        .from('store_car_brands')
        .select(`
          car_brands(id, name)
        `)
        .eq('store_id', id);
      
      if (brandError) throw brandError;
      
      // Get all models for this store
      const { data: modelData, error: modelError } = await supabase
        .from('store_car_models')
        .select(`
          car_models(id, name, brand_id)
        `)
        .eq('store_id', id);
        
      if (modelError) throw modelError;
      
      // Group models by brand_id for easier display
      const carBrands = brandData.map((brand) => {
        const brandId = brand.car_brands.id;
        const models = modelData
          .filter(model => model.car_models.brand_id === brandId)
          .map(model => ({
            id: model.car_models.id,
            name: model.car_models.name
          }));
        
        return {
          id: brandId,
          name: brand.car_brands.name,
          models: models
        };
      });
      
      return carBrands;
    },
    enabled: !!id
  });

  // Seller products query
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

  // Reviews query
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

  // Seller product count query
  const { data: productCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['seller-products-count', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return 0;
      
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', store.seller_id)
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!store?.seller_id
  });

  // Sold product count query
  const { data: soldProductCount = 0, isLoading: isSoldCountLoading } = useQuery({
    queryKey: ['seller-sold-products-count', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return 0;
      
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', store.seller_id)
        .eq('status', 'sold');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!store?.seller_id
  });

  // Format location for display - simplified to just return the string
  const formatLocation = (location: string | null) => {
    if (!location) return 'Местоположение не указано';
    return location;
  };

  const getMainImageUrl = () => {
    // First uploaded photo will always be the main one
    if (store?.store_images && store.store_images.length > 0) {
      // First check if there's an image with is_primary = true
      const primaryImage = store.store_images.find(img => img.is_primary);
      if (primaryImage) return primaryImage.url;
      
      // Otherwise return the first image from the array
      return store.store_images[0].url;
    }
    return '/placeholder.svg';
  };

  const onReviewSubmitted = () => {
    refetch();
  };

  const handleContactTelegram = () => {
    if (!store?.telegram && !store?.phone) {
      toast({
        title: "Контакт недоступен",
        description: "У этого магазина нет контактной информации Telegram",
        variant: "destructive",
      });
      return;
    }
    
    // Use store.telegram if available, otherwise use phone for backward compatibility
    const telegramUsername = store.telegram || store.phone;
    const formattedUsername = telegramUsername?.startsWith('@') 
      ? telegramUsername.substring(1) 
      : telegramUsername;
      
    window.open(`https://t.me/${formattedUsername}`, '_blank');
  };

  const handleContactWhatsApp = () => {
    if (!store?.phone) {
      toast({
        title: "Контакт недоступен",
        description: "У этого магазина нет номера телефона для WhatsApp",
        variant: "destructive",
      });
      return;
    }
    
    // Clean the number, only keep digits
    const phoneNumber = store.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Share functionality
  const handleShareStore = async () => {
    const url = window.location.href;
    const storeName = store?.name || 'магазин';
    const shareData = {
      title: `${storeName} - Автозапчасти OPT`,
      text: `Посмотрите этот магазин автозапчастей: ${storeName}`,
      url: url,
    };

    try {
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на магазин скопирована в буфер обмена"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
        {/* Back button */}
        <div className="mb-6 flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={handleGoBack}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </Button>
          
          {/* Share button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleShareStore}
                className="ml-auto"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Поделиться</TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column content */}
          <div className="md:col-span-2">
            {/* Store name, rating, tags */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  {store.name}
                  {/* Verification status badge */}
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
                
                {/* Mobile share button */}
                <div className="md:hidden">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShareStore}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">Поделиться</span>
                  </Button>
                </div>
              </div>
              
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
              {/* Tabs list */}
              <TabsList className="mb-4">
                <TabsTrigger value="about">О магазине</TabsTrigger>
                <TabsTrigger value="photos">Фото</TabsTrigger>
                <TabsTrigger value="products">Объявления</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              </TabsList>

              {/* About tab */}
              <TabsContent value="about" className="space-y-4">
                {store.description && (
                  <div>
                    <h3 className="font-medium mb-2">Описание</h3>
                    <p className="text-muted-foreground">{store.description}</p>
                  </div>
                )}
                
                {/* Car brands and models display */}
                {carBrandsData && carBrandsData.length > 0 && (
                  <div className="mt-6 bg-muted/30 p-4 rounded-lg border">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Car className="w-4 h-4 mr-2" />
                      Марки и модели автомобилей
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                      {carBrandsData.map((brand) => (
                        <div key={brand.id} className="bg-card rounded-md p-3 border">
                          <div className="flex items-center mb-2">
                            <CarFront className="w-4 h-4 mr-2 text-primary" />
                            <span className="font-medium">{brand.name}</span>
                          </div>
                          {brand.models && brand.models.length > 0 ? (
                            <div className="flex flex-wrap gap-1 ml-6">
                              {brand.models.map((model) => (
                                <Badge 
                                  key={model.id} 
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {model.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground ml-6">
                              Все модели
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Store photos after description */}
                {store.store_images && store.store_images.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Image className="w-4 h-4 mr-2" />
                      Фотографии магазина
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  </div>
                )}
              </TabsContent>

              {/* Photos tab */}
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

              {/* Products tab */}
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

              {/* Reviews tab */}
              <TabsContent value="reviews">
                <div className="space-y-6">
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

          {/* Right column - Store info and contact */}
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
                {/* Store info */}
                <div>
                  <h3 className="font-medium mb-1">Адрес</h3>
                  <p className="text-muted-foreground">{store.address}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Статус</h3>
                  <div className="flex items-center">
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
                  </div>
                </div>

                {/* Product information */}
                <div>
                  <h3 className="font-medium mb-1">Объявления</h3>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{isCountLoading ? "Загрузка..." : productCount} активных</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-500" />
                      <span>{isSoldCountLoading ? "Загрузка..." : soldProductCount} проданных</span>
                    </p>
                  </div>
                </div>

                {/* Car brands summary for sidebar */}
                {carBrandsData && carBrandsData.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-1">Марки автомобилей</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {carBrandsData.map((brand) => (
                        <Badge key={brand.id} variant="outline">
                          {brand.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="text-center mb-4">
                  <div className="font-medium">{reviews?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">отзывов</div>
                </div>

                {/* Contact buttons - make sure they're always visible if contact info is available */}
                {(store?.phone || store?.telegram) && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={handleContactTelegram}
                        className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white"
                      >
                        <Send className="mr-2 h-4 w-4" /> Telegram
                      </Button>
                      <Button 
                        onClick={handleContactWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5c] text-white"
                        disabled={!store?.phone}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                {/* Button to seller products */}
                <Button asChild className="w-full">
                  <Link to={`/seller/${store?.seller_id}`}>
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
        storeId={store?.id || ''}
        onSubmitted={onReviewSubmitted}
      />
    </Layout>
  );
};

export default StoreDetail;
