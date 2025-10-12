import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Store, Star, MapPin, ShieldCheck, Loader2, Share2, Copy } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import StoreSEO from '@/components/store/StoreSEO';
import { toast } from 'sonner';

const PublicStore = () => {
  const { storeId } = useParams<{ storeId: string }>();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setError('ID магазина отсутствует');
      setIsLoading(false);
      return;
    }
    loadStoreData();
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Проверяем авторизацию
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // 2. Загружаем магазин из VIEW
      const { data: storeData, error: storeError } = await supabase
        .from('stores_public')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError || !storeData) {
        throw new Error('Магазин не найден');
      }

      setStore(storeData);

      // 3. Загружаем товары из VIEW (разные VIEW для анонимов и авторизованных)
      const productsView = session ? 'products_for_buyers' : 'products_public';

      const { data: productsData, error: productsError } = await supabase
        .from(productsView)
        .select(`
          *,
          product_images(url, is_primary)
        `)
        .eq('seller_id', storeData.seller_id)
        .order('catalog_position', { ascending: true, nullsFirst: false });

      if (productsError) {
        console.error('Products error:', productsError);
      } else {
        setProducts(productsData || []);
      }

      // 4. Загружаем данные продавца
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, rating, verification_status, opt_id')
        .eq('id', storeData.seller_id)
        .single();

      setSeller(sellerData);

    } catch (err: any) {
      console.error('Error loading store:', err);
      setError(err.message || 'Не удалось загрузить магазин');
    } finally {
      setIsLoading(false);
    }
  };

  const copyStoreLink = async () => {
    const url = `${window.location.origin}/public-store/${storeId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    } catch (err) {
      toast.error('Не удалось скопировать');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/public-store/${storeId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text: `Магазин "${store.name}"`,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      copyStoreLink();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка магазина...</p>
        </div>
      </Layout>
    );
  }

  if (error || !store) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <Store className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Магазин не найден</h1>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <Button asChild>
            <Link to="/">Перейти на главную</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {store && (
        <StoreSEO
          store={{
            ...store,
            store_images: []
          }}
          reviewsCount={store.reviews_count}
          averageRating={store.rating}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Хлебные крошки */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{store.name}</span>
        </nav>

        {/* Шапка магазина */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{store.name}</h1>
                  {store.verified && (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      Проверен
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {store.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {store.rating.toFixed(1)} ({store.reviews_count || 0})
                    </span>
                  )}
                  {store.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {store.address}
                    </span>
                  )}
                </div>

                {store.tags && store.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {store.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопки "Поделиться" */}
              <div className="flex gap-2">
                <Button onClick={copyStoreLink} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать
                </Button>
                <Button onClick={handleShare} size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Информация о продавце */}
        {seller && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-3">О продавце</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="font-medium">
                    {seller.company_name || seller.full_name}
                  </p>
                  {seller.opt_id && (
                    <p className="text-sm text-muted-foreground">
                      OPT_ID: {seller.opt_id}
                    </p>
                  )}
                  {seller.verification_status === 'verified' && (
                    <Badge variant="secondary" className="mt-1">
                      ✓ Верифицирован
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Описание магазина */}
        {store.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{store.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Товары */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Товары ({products.length})
          </h2>

          {products.length > 0 ? (
            <ProductGrid
              products={products}
              isLoading={false}
            />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  В этом магазине пока нет товаров
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PublicStore;
