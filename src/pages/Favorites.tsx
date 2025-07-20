
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, ExternalLink, Star, MapPin, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MakeOfferButton } from '@/components/price-offer/MakeOfferButton';

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const navigate = useNavigate();

  const { data: favoriteProducts, isLoading } = useQuery({
    queryKey: ['favorite-products', favorites],
    queryFn: async () => {
      if (!favorites.length) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            is_primary
          )
        `)
        .in('id', favorites)
        .in('status', ['active', 'sold']);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && favorites.length > 0,
  });

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Войдите в аккаунт</h1>
          <p className="text-muted-foreground mb-4">
            Чтобы просматривать избранные товары, необходимо войти в систему
          </p>
          <Button asChild>
            <Link to="/login">Войти</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || favoritesLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка избранных товаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Избранное
        </h1>
        <p className="text-muted-foreground">
          {favorites.length === 0 
            ? "У вас пока нет избранных товаров" 
            : `${favorites.length} товар${favorites.length === 1 ? '' : favorites.length < 5 ? 'а' : 'ов'} в избранном`
          }
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-24 w-24 text-muted-foreground/50 mb-6" />
          <h2 className="text-xl font-semibold mb-2">Пока пусто</h2>
          <p className="text-muted-foreground mb-6">
            Добавляйте товары в избранное, чтобы быстро находить их позже
          </p>
          <Button asChild>
            <Link to="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts?.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-3">
                  {product.product_images?.[0] ? (
                    <img
                      src={product.product_images[0].url}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ShoppingCart className="h-12 w-12" />
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>

                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="absolute top-2 left-2"
                  >
                    {product.status === 'active' ? 'Активный' : 
                     product.status === 'sold' ? 'Продан' : 'Неактивный'}
                  </Badge>
                </div>

                <CardTitle className="text-lg line-clamp-2">
                  {product.title}
                </CardTitle>
                
                {product.brand && product.model && (
                  <p className="text-sm text-muted-foreground">
                    {product.brand} {product.model}
                  </p>
                )}

                {product.seller_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Продавец: {product.seller_name}</span>
                    {product.rating_seller && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating_seller}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                  </div>

                  {product.product_location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{product.product_location}</span>
                    </div>
                  )}

                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link to={`/product/${product.id}`} className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Подробнее
                      </Link>
                    </Button>
                    
                    <MakeOfferButton 
                      product={product}
                      compact={true}
                    />
                    
                    {product.telegram_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={`https://t.me/${product.telegram_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
