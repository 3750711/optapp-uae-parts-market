import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProductCard from '@/components/product/ProductCard';
import { Loader2, AlertCircle, User, Store, Star, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProductStatus = 'active' | 'sold' | 'pending' | 'archived';

interface ProfileData {
  id: string;
  full_name: string;
  company_name?: string;
  user_type: string;
  rating?: number;
  verification_status?: string;
}

interface Product {
  id: string;
  title: string;
  brand: string;
  model?: string;
  price: number;
  condition: string;
  lot_number: number;
  created_at: string;
  seller_name: string;
  seller_id: string;
  status: ProductStatus;
  images?: { url: string }[];
}

const PublicProfile = () => {
  const { token } = useParams<{ token: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен не найден');
      setLoading(false);
      return;
    }

    validateTokenAndLoadData();
  }, [token]);

  const validateTokenAndLoadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [PublicProfile] Starting token validation for:', token);
      
      // Validate token via Edge Function
      const { data: validation, error: validationError } = await supabase.functions.invoke(
        'validate-profile-token',
        {
          body: { token }
        }
      );

      console.log('📋 [PublicProfile] Edge Function response:');
      console.log('  - validation:', validation);
      console.log('  - validationError:', validationError);
      console.log('  - validation?.valid:', validation?.valid);
      console.log('  - typeof validation:', typeof validation);
      console.log('  - JSON.stringify(validation):', JSON.stringify(validation));
      console.log('  - JSON.stringify(validationError):', JSON.stringify(validationError));

      if (validationError || !validation?.valid) {
        console.error('❌ [PublicProfile] Token validation failed:');
        console.error('  - validationError exists:', !!validationError);
        console.error('  - validation?.valid:', validation?.valid);
        console.error('  - Full validationError object:', validationError);
        console.error('  - Full validation object:', validation);
        setError('Недействительная или просроченная ссылка');
        return;
      }

      console.log('✅ [PublicProfile] Token validation successful, profile data:', validation.profile);

      const profileData = validation.profile;
      setProfile(profileData);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          brand,
          model,
          price,
          condition,
          lot_number,
          created_at,
          seller_name,
          seller_id,
          status,
          product_images!inner(url)
        `)
        .eq('seller_id', profileData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (productsError) {
        console.error('Error loading products:', productsError);
        setError('Ошибка загрузки товаров');
        return;
      }

      // Transform products data to include images
      const transformedProducts = productsData?.map(product => ({
        ...product,
        images: product.product_images || []
      })) || [];

      setProducts(transformedProducts);

    } catch (error) {
      console.error('Error:', error);
      setError('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Ошибка доступа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'Профиль не найден'}
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                Перейти на главную
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.company_name || profile.full_name || 'Продавец автозапчастей';

  return (
    <>
      <Helmet>
        <title>{displayName} - Каталог автозапчастей | PartsBay</title>
        <meta name="description" content={`Каталог автозапчастей от ${displayName}. Качественные запчасти с доставкой в ОАЭ.`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://partsbay.ae/public-profile/${token}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {profile.company_name ? (
                    <Store className="h-8 w-8 text-primary" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">
                      {displayName}
                    </h1>
                    {profile.verification_status === 'verified' && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Проверен
                      </Badge>
                    )}
                  </div>
                  
                  {profile.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{profile.rating}</span>
                      <span className="text-sm text-muted-foreground">рейтинг</span>
                    </div>
                  )}
                  
                  <p className="text-muted-foreground">
                    Каталог качественных автозапчастей в ОАЭ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auth Required Alert */}
          <Alert className="border-primary/20 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Полный доступ требует регистрации</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Для связи с продавцом и получения контактной информации необходимо зарегистрироваться на сайте.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild>
                  <Link to="/auth">Войти / Регистрация</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Перейти на сайт</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Товары ({products.length})
              </h2>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    У этого продавца пока нет активных товаров
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/">
                      Посмотреть все товары
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Call to Action */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                Хотите увидеть больше товаров?
              </h3>
              <p className="text-muted-foreground">
                Зарегистрируйтесь для доступа ко всем функциям сайта
              </p>
              <Button asChild size="lg">
                <Link to="/auth">
                  Присоединиться к PartsBay
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PublicProfile;