
import React, { useState, useMemo } from 'react';
import { Search, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleBuyerOffers, useSimpleBuyerOfferCounts } from '@/hooks/useSimpleBuyerOffers';
import { usePriceOffersRealtime } from '@/hooks/usePriceOffersRealtime';
import { SimpleOfferCard } from '@/components/offers/SimpleOfferCard';
import Layout from '@/components/layout/Layout';
import { formatPrice } from '@/utils/formatPrice';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set());
  
  // Enable real-time updates
  usePriceOffersRealtime();
  
  const { 
    data: offerProducts, 
    isLoading, 
    forceRefresh
  } = useSimpleBuyerOffers(statusFilter);

  const { data: offerCounts } = useSimpleBuyerOfferCounts();

  // Process and filter products
  const filteredProducts = useMemo(() => {
    if (!offerProducts) return [];

    return offerProducts.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [offerProducts, searchTerm]);

  // Calculate stats from offer counts
  const stats = useMemo(() => {
    if (offerCounts) {
      const totalValue = offerProducts?.reduce((sum, p) => sum + (p.user_offer_price || 0), 0) || 0;
      const activeTotalValue = offerProducts?.filter(p => p.user_offer_status === 'pending').reduce((sum, p) => sum + (p.user_offer_price || 0), 0) || 0;
      return {
        pending: offerCounts.pending,
        expired: offerCounts.expired,
        rejected: offerCounts.rejected,
        accepted: offerCounts.accepted,
        total: offerCounts.total,
        totalValue,
        activeTotalValue
      };
    }
    
    // Fallback calculation
    if (!offerProducts) return { pending: 0, expired: 0, rejected: 0, accepted: 0, total: 0, totalValue: 0, activeTotalValue: 0 };
    
    const activeTotalValue = offerProducts.filter(p => p.user_offer_status === 'pending').reduce((sum, p) => sum + (p.user_offer_price || 0), 0);
    
    return {
      pending: offerProducts.filter(p => p.user_offer_status === 'pending').length,
      expired: offerProducts.filter(p => p.user_offer_status === 'expired').length,
      rejected: offerProducts.filter(p => p.user_offer_status === 'rejected').length,
      accepted: offerProducts.filter(p => p.user_offer_status === 'accepted').length,
      total: offerProducts.length,
      totalValue: offerProducts.reduce((sum, p) => sum + (p.user_offer_price || 0), 0),
      activeTotalValue
    };
  }, [offerProducts, offerCounts]);

  const getStatusProducts = (status: string) => {
    if (!filteredProducts) return [];
    
    switch (status) {
      case 'pending':
        return filteredProducts.filter(p => p.user_offer_status === 'pending');
      case 'expired':
        return filteredProducts.filter(p => p.user_offer_status === 'expired');
      case 'rejected':
        return filteredProducts.filter(p => p.user_offer_status === 'rejected');
      case 'accepted':
        return filteredProducts.filter(p => p.user_offer_status === 'accepted');
      default:
        return filteredProducts;
    }
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

  const getEmptyStateMessage = (filter: string) => {
    switch (filter) {
      case 'pending':
        return {
          title: 'Нет активных предложений',
          description: 'У вас нет активных предложений цены. Найдите интересные товары и сделайте предложение!'
        };
      case 'expired':
        return {
          title: 'Нет истекших предложений',
          description: 'У вас нет предложений с истекшим сроком действия.'
        };
      case 'rejected':
        return {
          title: 'Нет отклоненных предложений',
          description: 'У вас нет отклоненных предложений.'
        };
      case 'accepted':
        return {
          title: 'Нет принятых предложений',
          description: 'У вас нет принятых предложений.'
        };
      default:
        return {
          title: searchTerm ? 'Товары не найдены' : 'Нет предложений',
          description: searchTerm 
            ? 'Попробуйте изменить поисковый запрос' 
            : 'Начните участвовать в торгах, чтобы увидеть ваши предложения здесь'
        };
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
            Мои предложения цены
          </h1>
          <p className="text-muted-foreground text-lg">
            Управляйте своими предложениями цены
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className={stats.pending > 0 ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-xl font-bold text-blue-600">{stats.pending}</div>
              </div>
              <div className="text-sm text-muted-foreground">Активные</div>
            </CardContent>
          </Card>
          
          <Card className={stats.accepted > 0 ? "border-green-200 bg-green-50/30" : ""}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-xl font-bold text-green-600">{stats.accepted}</div>
              </div>
              <div className="text-sm text-muted-foreground">Принятые</div>
            </CardContent>
          </Card>
          
          <Card className={stats.rejected > 0 ? "border-red-200 bg-red-50/30" : ""}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
              </div>
              <div className="text-sm text-muted-foreground">Отклоненные</div>
            </CardContent>
          </Card>
          
          <Card className={stats.expired > 0 ? "border-orange-200 bg-orange-50/30" : ""}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div className="text-xl font-bold text-orange-600">{stats.expired}</div>
              </div>
              <div className="text-sm text-muted-foreground">Истекшие</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-purple-600 mb-2">{formatPrice(stats.activeTotalValue)}</div>
              <div className="text-sm text-muted-foreground">Сумма активных предложений</div>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Все ({filteredProducts.length})</TabsTrigger>
            <TabsTrigger value="pending">Активные ({getStatusProducts('pending').length})</TabsTrigger>
            <TabsTrigger value="accepted">Принятые ({getStatusProducts('accepted').length})</TabsTrigger>
            <TabsTrigger value="rejected">Отклоненные ({getStatusProducts('rejected').length})</TabsTrigger>
            <TabsTrigger value="expired">Истекшие ({getStatusProducts('expired').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-8">
            {getStatusProducts(statusFilter).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {getEmptyStateMessage(statusFilter).title}
                  </h3>
                  <p className="text-muted-foreground">
                    {getEmptyStateMessage(statusFilter).description}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getStatusProducts(statusFilter).map((product) => (
                  <SimpleOfferCard
                    key={product.id}
                    product={product}
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
