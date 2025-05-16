
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, User, Star, Building2, MessageSquare, Package2, Crown, ShoppingCart, Store as StoreIcon, Car, Send, Heart } from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const PublicSellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string } | null>(null);
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fixed back button functionality
  const handleGoBack = () => {
    try {
      // First, try to navigate back in history
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        // If there's no previous page, navigate to the home page
        navigate('/');
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to home page if navigation fails
      navigate('/');
    }
  };

  // Проверка существования профиля - выполняется всегда, независимо от авторизации
  const { data: profileExistsCheck, isLoading: isCheckLoading } = useQuery({
    queryKey: ["seller-profile-exists", id],
    queryFn: async () => {
      if (!id) return false;
      
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("id", { count: 'exact', head: true })
          .eq("id", id);

        if (error) {
          console.error("Error checking if profile exists:", error);
          return false;
        }
        
        return count && count > 0;
      } catch (err) {
        console.error("Exception checking profile existence:", err);
        return false;
      }
    },
    enabled: !!id,
  });

  // Установка состояния существования профиля после загрузки
  useEffect(() => {
    if (!isCheckLoading) {
      setProfileExists(profileExistsCheck);
      console.log("Profile exists check result:", profileExistsCheck);
    }
  }, [profileExistsCheck, isCheckLoading]);
  
  // Получение данных профиля продавца - выполняется только если пользователь авторизован
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      if (!id) return null;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle(); // Используем maybeSingle вместо single чтобы избежать ошибки

        if (error) {
          console.error("Error fetching seller profile:", error);
          throw error;
        }
        
        return data;
      } catch (err) {
        console.error("Exception fetching seller profile:", err);
        return null;
      }
    },
    enabled: !!id && !!user,
  });

  // Проверка, добавлен ли продавец в избранное
  useEffect(() => {
    if (!user || !id) return;

    const checkFavorite = async () => {
      try {
        const { data, error } = await supabase
          .from('favorite_sellers')
          .select('*')
          .eq('user_id', user.id)
          .eq('seller_id', id)
          .maybeSingle();

        if (!error && data) {
          setIsFavorite(true);
        }
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavorite();
  }, [user, id]);

  // Добавление/удаление из избранного
  const toggleFavorite = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    try {
      if (isFavorite) {
        // Удаляем из избранного
        const { error } = await supabase
          .from('favorite_sellers')
          .delete()
          .eq('user_id', user.id)
          .eq('seller_id', id);

        if (error) throw error;
        
        setIsFavorite(false);
        toast({
          description: "Продавец удален из избранного",
        });
      } else {
        // Добавляем в избранное
        const { error } = await supabase
          .from('favorite_sellers')
          .insert({
            user_id: user.id,
            seller_id: id,
            seller_name: profile?.full_name || "Продавец"
          });

        if (error) throw error;
        
        setIsFavorite(true);
        toast({
          description: "Продавец добавлен в избранное",
        });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
      });
    }
  };

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!id) return;
      
      try {
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
      } catch (err) {
        console.error("Error fetching store info:", err);
      }
    };

    fetchStoreInfo();
  }, [id]);

  const { data: orderCount } = useQuery({
    queryKey: ["seller-orders-count", id],
    queryFn: async () => {
      if (!id) return 0;
      
      // Если пользователь не авторизован, показываем заглушку
      if (!user) return "?";
      
      try {
        const { count, error } = await supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .eq("seller_id", id);

        if (error) throw error;
        return count || 0;
      } catch (err) {
        console.error("Error fetching order count:", err);
        return 0;
      }
    },
    enabled: !!id,
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["seller-products", id],
    queryFn: async () => {
      if (!id) return [];

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(url, is_primary)")
          .eq("seller_id", id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching products:", err);
        return [];
      }
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
    const sellerName = profile?.full_name ? encodeURIComponent(profile.full_name) : encodeURIComponent("Продавец на OPT");
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

  // Форматирование времени последнего входа
  const formatLastActive = (lastLoginTime?: string) => {
    if (!lastLoginTime) return "Нет данных";
    
    try {
      const date = new Date(lastLoginTime);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: ru 
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Нет данных";
    }
  };

  if (isCheckLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  // Профиль действительно не существует - показываем страницу с ошибкой
  if (profileExists === false && !isCheckLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Профиль продавца не найден</h2>
            <p className="text-gray-500 mt-2 mb-6">Запрошенный профиль не существует или был удален</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="default" 
                onClick={() => navigate('/')}
              >
                Вернуться на главную
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/catalog')}
              >
                Перейти в каталог
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Профиль существует, но пользователь не авторизован - показываем страницу с требованием авторизации
  if (!user && profileExists === true) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Авторизация требуется
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-primary/50 bg-primary/10">
                <AlertTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> 
                  Просмотр профиля продавца
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                  <p>
                    Для просмотра профиля продавца необходимо авторизоваться на сайте или зарегистрироваться.
                    После авторизации вы сможете видеть полную информацию о продавце и его товары.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => navigate('/login')}>Войти</Button>
                    <Button variant="outline" onClick={() => navigate('/register')}>Регистрация</Button>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-gray-600 text-center">
                  На OPT наши пользователи могут просматривать профили продавцов только после авторизации 
                  для обеспечения безопасности и качества сервиса.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Предварительная информация о продавце */}
          <div className="text-center mt-8">
            <Button 
              variant="default" 
              onClick={() => navigate('/catalog')}
              className="mx-auto"
            >
              Перейти в каталог
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
            onClick={handleGoBack}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Кнопка добавления в избранное */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isFavorite ? "default" : "outline"} 
                  size="sm"
                  onClick={toggleFavorite}
                  className="flex items-center gap-2"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-white" : ""}`} />
                  {isFavorite ? "В избранном" : "В избранное"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
              </TooltipContent>
            </Tooltip>

            {/* Кнопка поделиться в Telegram */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareToTelegram}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> 
              Поделиться
            </Button>
          </div>
        </div>

        {!user && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <AlertTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> 
              Требуется авторизация
            </AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <p>
                Для просмотра полной информации о продавце необходимо авторизоваться на сайте или зарегистрироваться.
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
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "Продавец"} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
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
                  
                  {/* Статус активности */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        profile?.last_login && (new Date().getTime() - new Date(profile.last_login).getTime() < 7 * 24 * 60 * 60 * 1000) 
                        ? "bg-green-500" : "bg-gray-400"
                      }`}></span>
                      <span className="text-sm text-gray-600">
                        Был(а) в сети: {formatLastActive(profile?.last_login)}
                      </span>
                    </span>
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
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
              {profile?.rating !== null && profile?.rating !== undefined && (
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
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Нет данных"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Объявления продавца</CardTitle>
            <Badge variant="outline" className="text-lg">
              {mappedProducts?.length || 0}
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
