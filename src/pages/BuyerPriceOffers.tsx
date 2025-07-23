
import React, { useState, useEffect } from 'react';
import { Gavel, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions, useBuyerOfferCounts } from '@/hooks/useRealtimeBuyerAuctions';
import { useBatchOffers } from '@/hooks/use-price-offers-batch';
import ProductListItem from '@/components/product/ProductListItem';
import { OfferStatusFilter } from '@/components/offers/OfferStatusFilter';
import { PusherConnectionIndicator } from '@/components/offers/PusherConnectionIndicator';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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

  // Get batch data for optimization
  const productIds = auctionProducts?.map(p => p.id) || [];
  const { data: batchOffersData } = useBatchOffers(productIds);

  // Debug logging to track data flow
  useEffect(() => {
    console.log('🏠 BuyerPriceOffers data update:', {
      statusFilter,
      productsCount: auctionProducts?.length || 0,
      lastUpdateTime: lastUpdateTime?.toISOString(),
      isConnected,
      realtimeEventsCount: realtimeEvents?.length || 0,
      batchOffersDataCount: batchOffersData?.length || 0
    });
  }, [statusFilter, auctionProducts, lastUpdateTime, isConnected, realtimeEvents, batchOffersData]);

  // Log when realtime events arrive
  useEffect(() => {
    if (realtimeEvents && realtimeEvents.length > 0) {
      console.log('🔔 New realtime events in BuyerPriceOffers:', realtimeEvents.slice(0, 3));
    }
  }, [realtimeEvents]);

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

  const filteredProducts = auctionProducts?.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gavel className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Мои предложения
              </h1>
              {/* Enhanced real-time indicator */}
              {isConnected && (
                <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                  {realtimeEvents && realtimeEvents.length > 0 && (
                    <span className="text-xs bg-green-600 text-white px-1 rounded">
                      {realtimeEvents.length}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Simple connection indicator */}
            <PusherConnectionIndicator
              connectionState={connectionState}
              onReconnect={forceRefresh}
              lastUpdateTime={lastUpdateTime}
              realtimeEvents={realtimeEvents}
              compact={true}
            />
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              Управляйте своими предложениями цены и отслеживайте статус торгов
            </p>
          </div>

          {/* Connection status */}
          <PusherConnectionIndicator
            connectionState={connectionState}
            onReconnect={forceRefresh}
            lastUpdateTime={lastUpdateTime}
            realtimeEvents={realtimeEvents}
            compact={false}
          />
        </div>

        {/* Status Filter */}
        {offerCounts && (
          <OfferStatusFilter
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
            counts={offerCounts}
          />
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по товарам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Debug info for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <div>Products: {filteredProducts.length}</div>
            <div>Last Update: {lastUpdateTime?.toISOString()}</div>
            <div>Events: {realtimeEvents?.length || 0}</div>
            <div>Batch Data: {batchOffersData?.length || 0}</div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                {searchTerm ? 'Товары не найдены' : 
                 statusFilter === 'all' ? 'Нет предложений' : 
                 statusFilter === 'active' ? 'Нет активных предложений' :
                 statusFilter === 'cancelled' ? 'Нет отмененных предложений' :
                 'Нет завершенных предложений'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Попробуйте изменить поисковый запрос' 
                  : statusFilter === 'all' ? 'Вы пока не делали предложений цены'
                  : 'Попробуйте выбрать другой фильтр статуса'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                batchOffersData={batchOffersData}
                showOfferStatus={true}
                showAuctionInfo={true}
                lastUpdateTime={lastUpdateTime}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
