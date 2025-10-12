import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PublicProductCard from '@/components/product/PublicProductCard';
import { Loader2, AlertCircle, User, Store, Star, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { getPublicProfileTranslations } from '@/utils/translations/publicProfile';
import Layout from '@/components/layout/Layout';
import LanguageToggle from '@/components/auth/LanguageToggle';

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
  const { sellerId } = useParams<{ sellerId: string }>();
  const { language, changeLanguage } = useLanguage('en'); // English as default for public profiles
  const t = getPublicProfileTranslations(language);  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setError('SELLER_ID_NOT_FOUND');
      setLoading(false);
      return;
    }

    loadProfileData();
  }, [sellerId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile directly by seller_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, user_type, rating, verification_status')
        .eq('id', sellerId)
        .eq('user_type', 'seller')
        .single();

      if (profileError || !profileData) {
        console.error('Error loading profile:', profileError);
        setError('PROFILE_NOT_FOUND');
        return;
      }

      setProfile(profileData);

      // Load active products
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
        setError('ERROR_LOADING_PRODUCTS');
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
      setError('DATA_LOADING_ERROR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t.loadingProfile}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        {/* Language Toggle for Error State */}
        <div className="absolute top-4 right-4">
          <LanguageToggle 
            language={language}
            onLanguageChange={changeLanguage}
          />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t.errorAccess}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error === 'SELLER_ID_NOT_FOUND' ? t.tokenNotFound :
               error === 'PROFILE_NOT_FOUND' ? t.profileNotFound :
               error === 'ERROR_LOADING_PRODUCTS' ? t.errorLoadingProducts :
               error === 'DATA_LOADING_ERROR' ? t.dataLoadingError :
               t.profileNotFound}
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                {t.goToHome}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.company_name || profile.full_name || t.autoPartsDealer;

  return (
    <Layout language={language}>
      <Helmet>
        <title>{t.catalogTitle(displayName)}</title>
        <meta name="description" content={t.catalogDescription(displayName)} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://partsbay.ae/public-profile/${sellerId}`} />
        
        {/* Hreflang tags for multilingual support */}
        <link rel="alternate" hrefLang="en" href={`https://partsbay.ae/en/public-profile/${sellerId}`} />
        <link rel="alternate" hrefLang="ru" href={`https://partsbay.ae/ru/public-profile/${sellerId}`} />
        <link rel="alternate" hrefLang="bn" href={`https://partsbay.ae/bn/public-profile/${sellerId}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://partsbay.ae/public-profile/${sellerId}`} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={t.catalogTitle(displayName)} />
        <meta property="og:description" content={t.catalogDescription(displayName)} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://partsbay.ae/public-profile/${sellerId}`} />
        <meta property="og:locale" content={language === 'en' ? 'en_AE' : language === 'ru' ? 'ru_AE' : 'bn_BD'} />
        <meta property="og:site_name" content="PartsBay" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t.catalogTitle(displayName)} />
        <meta name="twitter:description" content={t.catalogDescription(displayName)} />
        
        <html lang={language} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Language Toggle for Public Profile */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle 
            language={language}
            onLanguageChange={changeLanguage}
          />
        </div>
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
                        {t.verified}
                      </Badge>
                    )}
                  </div>
                  
                  {profile.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{profile.rating}</span>
                      <span className="text-sm text-muted-foreground">{t.rating}</span>
                    </div>
                  )}
                  
                  <p className="text-muted-foreground">
                    {t.qualityAutoPartsCatalog}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {t.products(products.length)}
              </h2>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {t.noActiveProducts}
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/">
                      {t.viewAllProducts}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    language={language}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PublicProfile;