
import React, { useState, useMemo } from 'react';
import { Search, Heart, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions } from '@/hooks/useRealtimeBuyerAuctions';
import { AuctionProductCard } from '@/components/auction/AuctionProductCard';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set());
  
  const { 
    data: auctionProducts, 
    isLoading, 
    lastUpdateTime 
  } = useRealtimeBuyerAuctions(statusFilter);

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

  const handleFavoriteToggle = (productId: string) => {
    setFavoriteProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
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
                  <AuctionProductCard
                    key={product.id}
                    product={product}
                    lastUpdateTime={lastUpdateTime}
                    onFavorite={handleFavoriteToggle}
                    isFavorite={favoriteProducts.has(product.id)}
                  />
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
