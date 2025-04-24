import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, User, Star, Building2, MessageSquare, Package2, Crown, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { ProductProps } from "@/components/product/ProductCard";
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

const PublicSellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    
    let condition: "Новый" | "Б/У" | "Восстановленный" = "Б/У";
    
    if (product.condition === "Новый" || product.condition === "Восстановленный") {
      condition = product.condition as "Новый" | "Восстановленный";
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
                {profile.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "Продавец"} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold mb-2">{profile.full_name || "Продавец"}</h2>
                    {profile.opt_status === 'opt_user' && (
                      <div className="flex items-center text-yellow-600">
                        <Crown className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">OPTSELLER</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {profile.opt_id ? `OPT ID: ${profile.opt_id}` : 'OPT ID не указан'}
                  </Badge>
                </div>
              </div>

              <Accordion type="single" collapsible>
                {profile.description_user && (
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
                    <div className="space-y-2">
                      {profile.company_name && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>{profile.company_name}</span>
                        </div>
                      )}
                      {profile.telegram && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span>{profile.telegram}</span>
                        </div>
                      )}
                    </div>
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
              {mappedProducts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            {mappedProducts.length > 0 ? (
              <ProductGrid products={mappedProducts} />
            ) : (
              <p className="text-center py-8 text-gray-500">
                У продавца пока нет активных объявлений
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PublicSellerProfile;
