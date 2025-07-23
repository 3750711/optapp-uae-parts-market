
import React, { useState, useMemo } from 'react';
import { Search, Heart, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions } from '@/hooks/useRealtimeBuyerAuctions';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set());
  
  const { data: auctionProducts, isLoading } = useRealtimeBuyerAuctions(statusFilter);

  // Process and filter products
  const filteredProducts = useMemo(() => {
    if (!auctionProducts) return [];

    return auctionProducts.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [auctionProducts, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!auctionProducts) return { active: 0, leading: 0, total: 0, totalValue: 0 };
    
    return {
      active: auctionProducts.filter(p => p.user_offer_status === 'pending').length,
      leading: auctionProducts.filter(p => p.is_user_leading).length,
      total: auctionProducts.length,
      totalValue: auctionProducts.reduce((sum, p) => sum + (p.user_offer_price || 0), 0)
    };
  }, [auctionProducts]);

  const getStatusProducts = (status: string) => {
    if (!filteredProducts) return [];
    
    switch (status) {
      case 'active':
        return filteredProducts.filter(p => p.user_offer_status === 'pending');
      case 'leading':
        return filteredProducts.filter(p => p.is_user_leading);
      case 'completed':
        return filteredProducts.filter(p => ['expired', 'rejected', 'accepted'].includes(p.user_offer_status || ''));
      default:
        return filteredProducts;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status: string, isLeading: boolean) => {
    if (isLeading && status === 'pending') {
      return <Badge variant="default" className="bg-green-500"><Trophy className="w-3 h-3 mr-1" />Лидируете</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Активна</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-500">Выиграли</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонена</Badge>;
      case 'expired':
        return <Badge variant="outline">Истекла</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Пожалуйста, войдите в систему</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Мои торги
          </h1>
          <p className="text-muted-foreground text-lg">
            Отслеживайте свои ставки и торги в режиме реального времени
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Активные торги</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.leading}</div>
              <div className="text-sm text-muted-foreground">Лидируете</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Всего торгов</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">{formatPrice(stats.totalValue)}</div>
              <div className="text-sm text-muted-foreground">Общая сумма</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск по названию или бренду..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все ({filteredProducts.length})</TabsTrigger>
            <TabsTrigger value="active">Активные ({getStatusProducts('active').length})</TabsTrigger>
            <TabsTrigger value="leading">Лидирую ({getStatusProducts('leading').length})</TabsTrigger>
            <TabsTrigger value="completed">Завершенные ({getStatusProducts('completed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-8">
            {getStatusProducts(statusFilter).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {searchTerm ? 'Товары не найдены' : 'Нет торгов'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Попробуйте изменить поисковый запрос' 
                      : 'Начните участвовать в торгах, чтобы увидеть их здесь'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getStatusProducts(statusFilter).map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                        {product.product_images?.[0]?.url ? (
                          <img 
                            src={product.product_images[0].url} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground">Нет фото</span>
                          </div>
                        )}
                        
                        {/* Favorite button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavoriteProducts(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(product.id)) {
                                newSet.delete(product.id);
                              } else {
                                newSet.add(product.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <Heart 
                            className={`h-4 w-4 ${favoriteProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                          />
                        </Button>

                        {/* Status badge */}
                        <div className="absolute top-2 left-2">
                          {getStatusBadge(product.user_offer_status || '', product.is_user_leading || false)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
                          <p className="text-sm text-muted-foreground">{product.brand} {product.model}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Ваша ставка:</span>
                            <span className="font-semibold text-lg">{formatPrice(product.user_offer_price || 0)}</span>
                          </div>
                          
                          {product.max_other_offer && product.max_other_offer > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Макс. ставка:</span>
                              <span className="font-medium">{formatPrice(product.max_other_offer)}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Всего ставок:</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{product.offers_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t">
                          <Button variant="outline" className="w-full">
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
