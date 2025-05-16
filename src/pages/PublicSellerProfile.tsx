
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, User, Star, Building2, MessageSquare, Package2, Crown, ShoppingCart, Store as StoreIcon, Car, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { ProductProps } from "@/components/product/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PublicSellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string } | null>(null);
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('seller_id', id)
        .maybeSingle();
        
      if (!error && data) {
        setStoreInfo(data);
        
        // Fetch car brands if store exists
        if (data.id) {
          const { data: brandsData, error: brandsError } = await supabase
            .from('store_car_brands')
            .select('car_brands(name)')
            .eq('store_id', data.id);
            
          if (!brandsError && brandsData) {
            const brandNames = brandsData
              .map(item => item.car_brands?.name)
              .filter(Boolean) as string[];
              
            setCarBrands(brandNames);
          }
        }
      }
    };

    fetchStoreInfo();
  }, [id]);

  const { data: orderCount } = useQuery({
    queryKey: ["seller-orders-count", id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("seller_id", id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["seller-products", id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(url, is_primary)")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const mappedProducts: ProductProps[] = products?.map(product => {
    const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                        product.product_images?.[0]?.url || 
                        '/placeholder.svg';
    
    // Fix the condition type to match exactly what's expected
    let condition: "Новый" | "Б/У" | "Восстановленный" = "Б/У";
    
    if (product.condition === "Новый") {
      condition = "Новый";
    } else if (product.condition === "Восстановленный") {
      condition = "Восстановленный";
    }
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: primaryImage,
      condition: condition,
      location: product.location || '',
      brand: product.brand || '',
      model: product.model || '',
      seller_name: product.seller_name,
      status: product.status,
      seller_rating: product.rating_seller,
      optid_created: product.optid_created,
      seller_id: product.seller_id
    };
  }) || [];

  // Share to Telegram directly
  const handleShareToTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const sellerName = encodeURIComponent(profile?.full_name || "Продавец на OPT");
    const text = encodeURIComponent(`Посмотрите профиль продавца: ${profile?.full_name || "Продавец"}`);
    
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShowContactInfo = () => {
    if (!user) {
      setShowAuthDialog(true);
    }
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/login');
  };

  if (isProfileLoading || isProductsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (!id || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
          </div>
          <div className="text-center">
            <p className="text-lg text-red-500">Профиль продавца не найден</p>
            <p className="text-gray-500 mt-2">Запрошенный профиль не существует или был удален</p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          
          {/* Direct Telegram share button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShareToTelegram}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" /> 
            Поделиться в Telegram
          </Button>
        </div>

        {!user && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <AlertTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> 
              Требуется авторизация
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <p>
                Для просмотра полного профиля продавца необходимо авторизоваться на сайте или зарегистрироваться.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => navigate('/login')}>Войти</Button>
                <Button variant="outline" onClick={() => navigate('/register')}>Регистрация</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Информация о продавце
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                {profile?.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "Продавец"} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold mb-2">{profile?.full_name || "Продавец"}</h2>
                    {profile?.opt_status === 'opt_user' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                        OPT
                      </span>
                    )}
                  </div>
                  {user ? (
                    <Badge variant="outline" className="text-sm">
                      {profile?.opt_id ? `OPT ID: ${profile.opt_id}` : 'OPT ID не указан'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-sm">
                      OPT ID: <span className="text-gray-400">скрыт</span>
                    </Badge>
                  )}
                </div>
              </div>

              {storeInfo && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center">
                    <StoreIcon className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <div className="font-medium">{storeInfo.name}</div>
                      <div className="text-sm text-gray-600">Магазин продавца</div>
                    </div>
                  </div>

                  {/* Show car brands if available */}
                  {carBrands.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-0 sm:ml-4">
                      <Car className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {carBrands.map((brand, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button asChild variant="outline" size="sm" className="whitespace-nowrap mt-2 sm:mt-0">
                    <Link to={`/stores/${storeInfo.id}`}>
                      Посмотреть магазин
                    </Link>
                  </Button>
                </div>
              )}

              <Accordion type="single" collapsible>
                {profile?.description_user && (
                  <AccordionItem value="description">
                    <AccordionTrigger>О продавце</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-700">{profile.description_user}</p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="contact">
                  <AccordionTrigger>Контактная информация</AccordionTrigger>
                  <AccordionContent>
                    {user ? (
                      <div className="space-y-2">
                        {profile?.company_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span>{profile.company_name}</span>
                          </div>
                        )}
                        {profile?.telegram && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <span>{profile.telegram}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
                        <p className="text-gray-600 mb-3">Для просмотра контактной информации необходимо авторизоваться</p>
                        <Button onClick={handleShowContactInfo}>
                          Войти для просмотра контактов
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-primary" />
                Статистика
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.rating !== null && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Рейтинг продавца</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(profile.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-medium">
                      {profile.rating?.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Всего объявлений</p>
                <p className="text-2xl font-bold">{mappedProducts.length}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Выполнено заказов</p>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold">{orderCount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">На платформе с</p>
                <p className="font-medium">
                  {new Date(profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Объявления продавца</CardTitle>
            <Badge variant="outline" className="text-lg">
              {mappedProducts?.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {mappedProducts && mappedProducts.length > 0 ? (
              user ? (
                <ProductGrid products={mappedProducts} />
              ) : (
                <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
                  <p className="text-gray-600 mb-4">Для просмотра всех объявлений продавца необходимо авторизоваться</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button onClick={() => navigate('/login')}>
                      Войти в аккаунт
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/register')}>
                      Зарегистрироваться
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-center py-8 text-gray-500">
                У продавца пока нет активных объявлений
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Требуется авторизация</DialogTitle>
            <DialogDescription>
              Для просмотра контактной информации продавца необходимо войти в аккаунт или зарегистрироваться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
              Войти / Зарегистрироваться
            </Button>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} className="w-full sm:w-auto">
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PublicSellerProfile;
