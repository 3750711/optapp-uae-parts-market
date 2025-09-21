import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, ExternalLink, Star, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductGrid from '@/components/product/ProductGrid';

interface PublicStoreData {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  verified: boolean;
  tags?: string[];
  seller: {
    full_name: string;
    opt_id: string;
    company_name?: string;
    rating?: number;
    verification_status: string;
  } | null;
}

const PublicStore = () => {
  const { token } = useParams<{ token: string }>();
  const [store, setStore] = useState<PublicStoreData | null>(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Неверная ссылка');
      setIsLoading(false);
      return;
    }

    loadStoreData();
  }, [token]);

  const loadStoreData = async () => {
    try {
      // Валидируем токен через Edge Function
      const { data: validation, error: validationError } = await supabase
        .functions.invoke('validate-store-token', {
          body: { token }
        });

      if (validationError) {
        console.error('Validation error:', validationError);
        setError('Ошибка проверки ссылки');
        return;
      }

      if (!validation.valid || !validation.store) {
        setError('Ссылка недействительна или истекла');
        return;
      }

      setStore(validation.store);

      // Загружаем товары магазина напрямую с использованием публичной политики
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary)
        `)
        .eq('seller_id', validation.store.seller_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Products error:', productsError);
        // Не блокируем загрузку магазина из-за ошибки товаров
      } else {
        setProducts(productsData || []);
      }

    } catch (err) {
      console.error('Error loading store data:', err);
      setError('Ошибка загрузки данных магазина');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Загрузка магазина...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Магазин недоступен</h1>
        <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <Button asChild>
          <a href="/">Перейти на главную</a>
        </Button>
      </div>
    );
  }

  const seller = store?.seller;
  const ratingToShow = seller?.rating ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок магазина */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3 flex-wrap">
              {store?.name}
              {/* Verification status badge */}
              {store?.verified ? (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                  <ShieldCheck className="w-3 h-3" />
                  Проверено
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1 text-amber-700 border-amber-200">
                  Не проверено
                </Badge>
              )}
            </h1>
            
            {/* Rating and location */}
            <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
              {ratingToShow && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-lg">
                    {ratingToShow.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">/ 5</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{store?.address}</span>
              </div>
            </div>

            {/* Tags */}
            {store?.tags && store.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {store.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="capitalize"
                  >
                    {tag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {seller && (
            <div className="text-center mb-4">
              <p className="text-lg text-muted-foreground mb-2">
                Продавец: {seller.full_name}
              </p>
              {seller.opt_id && (
                <p className="text-sm text-muted-foreground mb-2">
                  OPT_ID: {seller.opt_id}
                </p>
              )}
            </div>
          )}

          {store?.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              {store.description}
            </p>
          )}
        </div>

        {/* Призыв к регистрации */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Хотите связаться с продавцом?
          </h3>
          <p className="text-blue-800 mb-4">
            Зарегистрируйтесь бесплатно, чтобы увидеть контакты продавца и оформить заказ
          </p>
          <Button asChild size="lg">
            <a href="/auth/signup" className="inline-flex items-center">
              Зарегистрироваться бесплатно
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {/* Товары */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Товары {products.length > 0 && `(${products.length})`}
          </h2>
          
          {products.length > 0 ? (
            <ProductGrid 
              products={products} 
            />
          ) : (
            <div className="text-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                В этом магазине пока нет товаров
              </p>
              <p className="text-sm text-muted-foreground">
                Товары появятся после их добавления продавцом
              </p>
            </div>
          )}
        </div>

        {/* Футер с призывом к действию */}
        <div className="mt-12 text-center border-t pt-8">
          <p className="text-muted-foreground mb-4">
            Понравился этот магазин? Присоединяйтесь к нашей платформе!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <a href="/auth/login">Войти</a>
            </Button>
            <Button asChild>
              <a href="/auth/signup">Зарегистрироваться</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicStore;