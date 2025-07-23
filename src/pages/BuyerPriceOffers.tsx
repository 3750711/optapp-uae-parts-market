
import React, { useState, useEffect, useMemo } from 'react';
import { Search, SortAsc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions, useBuyerOfferCounts } from '@/hooks/useRealtimeBuyerAuctions';
import { useBatchOffers } from '@/hooks/use-price-offers-batch';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { AuctionHero } from '@/components/auction/AuctionHero';
import { AuctionSidebar } from '@/components/auction/AuctionSidebar';
import { LiveTicker } from '@/components/auction/LiveTicker';
import { DebugPanel } from '@/components/auction/DebugPanel';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set());
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const { 
    data: auctionProducts, 
    isLoading, 
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    forceRefresh,
    connectionState
  } = useRealtimeBuyerAuctions(statusFilter);
  
  const { data: offerCounts } = useBuyerOfferCounts();
  const productIds = auctionProducts?.map(p => p.id) || [];
  const { data: batchOffersData } = useBatchOffers(productIds);

  // Debug logging for the main page
  useEffect(() => {
    console.log('📊 BuyerPriceOffers page state:', {
      statusFilter,
      productsCount: auctionProducts?.length || 0,
      isConnected,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      realtimeEventsCount: realtimeEvents?.length || 0
    });
  }, [statusFilter, auctionProducts, isConnected, lastUpdateTime, realtimeEvents]);

  // Show debug panel in development or when explicitly enabled
  useEffect(() => {
    const shouldShowDebug = process.env.NODE_ENV === 'development' || 
                           localStorage.getItem('debug-auction') === 'true';
    setShowDebugPanel(shouldShowDebug);
  }, []);

  // Calculate hero stats
  const heroStats = useMemo(() => {
    const stats = {
      activeAuctions: auctionProducts?.filter(p => p.user_offer_status === 'pending').length || 0,
      totalBids: auctionProducts?.length || 0,
      totalValue: auctionProducts?.reduce((sum, p) => sum + (p.user_offer_price || 0), 0) || 0,
      userWins: auctionProducts?.filter(p => p.user_offer_status === 'accepted').length || 0,
      userActive: offerCounts?.active || 0,
      userLeading: auctionProducts?.filter(p => p.is_user_leading).length || 0,
    };
    
    console.log('📈 Hero stats calculated:', stats);
    return stats;
  }, [auctionProducts, offerCounts]);

  // Process products for display
  const processedProducts = useMemo(() => {
    if (!auctionProducts) return [];

    let filtered = auctionProducts.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.model?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && product.user_offer_status === 'pending') ||
                           (statusFilter === 'leading' && product.is_user_leading) ||
                           (statusFilter === 'ending' && product.user_offer_expires_at) ||
                           (statusFilter === 'completed' && ['expired', 'rejected', 'accepted'].includes(product.user_offer_status || ''));
      
      return matchesSearch && matchesStatus;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (b.user_offer_price || 0) - (a.user_offer_price || 0);
        case 'activity':
          return (b.offers_count || 0) - (a.offers_count || 0);
        case 'time':
        default:
          return new Date(b.user_offer_created_at || '').getTime() - new Date(a.user_offer_created_at || '').getTime();
      }
    });

    console.log('🔄 Processed products:', {
      total: auctionProducts.length,
      filtered: filtered.length,
      statusFilter,
      searchTerm
    });

    return filtered;
  }, [auctionProducts, searchTerm, statusFilter, sortBy]);

  // Create recent activity from realtime events
  const recentActivity = useMemo(() => {
    return (realtimeEvents || []).slice(0, 10).map(event => ({
      id: event.id,
      type: event.action === 'created' ? 'bid' as const : 'bid' as const,
      product: `Product ${event.product_id}`,
      amount: event.offered_price,
      time: new Date(event.created_at)
    }));
  }, [realtimeEvents]);

  // Live ticker events
  const liveEvents = useMemo(() => {
    return (realtimeEvents || []).map(event => ({
      id: event.id,
      type: 'bid' as const,
      product: `Товар ${event.product_id.slice(0, 8)}...`,
      user: event.buyer_id.slice(0, 8),
      amount: event.offered_price,
      time: new Date(event.created_at)
    }));
  }, [realtimeEvents]);

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

  const handleForceReconnect = () => {
    console.log('🔄 Manual reconnect triggered');
    forceRefresh();
  };

  const handleForceRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    forceRefresh();
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Пожалуйста, войдите в систему</p>
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
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <AuctionHero 
          stats={heroStats} 
          lastUpdateTime={lastUpdateTime}
        />

        {/* Live Ticker */}
        <div className="mb-6">
          <LiveTicker 
            events={liveEvents}
            isConnected={isConnected}
          />
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mb-6">
            <DebugPanel
              connectionState={connectionState}
              realtimeEvents={realtimeEvents}
              lastUpdateTime={lastUpdateTime}
              onForceReconnect={handleForceReconnect}
              onForceRefresh={handleForceRefresh}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <AuctionSidebar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              offerCounts={offerCounts || { active: 0, cancelled: 0, completed: 0, total: 0 }}
              recentActivity={recentActivity}
            />
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* View Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {processedProducts.length} торгов
                </h2>
                {statusFilter !== 'all' && (
                  <span className="text-sm text-gray-500">
                    • {statusFilter === 'active' ? 'Активные' : 
                       statusFilter === 'leading' ? 'Лидируете' :
                       statusFilter === 'ending' ? 'Заканчиваются' : 'Завершенные'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-xs"
                >
                  Debug
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Display */}
            {processedProducts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {searchTerm ? 'Товары не найдены' : 'Нет торгов'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Попробуйте изменить поисковый запрос' 
                      : 'Начните участвовать в торгах, чтобы увидеть их здесь'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                  : 'space-y-4'
              }>
                {processedProducts.map((product) => {
                  const batchData = batchOffersData?.find(b => b.product_id === product.id);
                  
                  return (
                    <AuctionCard
                      key={product.id}
                      product={product}
                      userOfferPrice={product.user_offer_price}
                      maxCompetitorPrice={product.max_other_offer}
                      isUserLeading={product.is_user_leading}
                      totalOffers={product.offers_count || 0}
                      expiresAt={product.user_offer_expires_at}
                      lastUpdateTime={lastUpdateTime}
                      onFavorite={handleFavoriteToggle}
                      isFavorite={favoriteProducts.has(product.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
