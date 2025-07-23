
import React, { useState } from 'react';
import { Gavel, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions, useBuyerOfferCounts } from '@/hooks/useRealtimeBuyerAuctions';
import { useBatchOffers } from '@/hooks/use-price-offers-batch';
import ProductListItem from '@/components/product/ProductListItem';
import { OfferStatusFilter } from '@/components/offers/OfferStatusFilter';
import { PusherConnectionIndicator } from '@/components/offers/PusherConnectionIndicator';
import { PusherDiagnostics } from '@/components/offers/PusherDiagnostics';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const { 
    data: auctionProducts, 
    isLoading, 
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    freshDataIndicator,
    forceRefresh,
    forceUpdateCounter,
    connectionState
  } = useRealtimeBuyerAuctions(statusFilter);
  const { data: offerCounts } = useBuyerOfferCounts();

  // Get batch data for optimization
  const productIds = auctionProducts?.map(p => p.id) || [];
  const { data: batchOffersData } = useBatchOffers(productIds);

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
              {forceUpdateCounter > 0 && (
                <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Live #{forceUpdateCounter}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Pusher Connection Indicator */}
              <PusherConnectionIndicator
                connectionState={connectionState}
                onReconnect={forceRefresh}
                lastUpdateTime={lastUpdateTime}
                realtimeEvents={realtimeEvents}
                compact={true}
              />
              
              {/* Diagnostics Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="flex items-center gap-1"
              >
                <Settings className="h-3 w-3" />
                {showDiagnostics ? 'Скрыть' : 'Диагностика'}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <p className="text-gray-600">
              Управляйте своими предложениями цены и отслеживайте статус торгов
            </p>
            <div className="text-sm text-green-600">
              • Real-time обновления активны (события: {realtimeEvents.length})
            </div>
          </div>

          {/* Diagnostics Panel */}
          {showDiagnostics && (
            <div className="mb-6">
              <PusherDiagnostics
                connectionState={connectionState}
                realtimeEvents={realtimeEvents}
                lastUpdateTime={lastUpdateTime}
                onReconnect={forceRefresh}
                onForceRefresh={forceRefresh}
              />
            </div>
          )}

          {/* Full Connection Indicator */}
          {!showDiagnostics && (
            <PusherConnectionIndicator
              connectionState={connectionState}
              onReconnect={forceRefresh}
              lastUpdateTime={lastUpdateTime}
              realtimeEvents={realtimeEvents}
              compact={false}
            />
          )}
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
                  : statusFilter === 'all' ? 'Вы пока не делали предложений цены. Найдите интересные товары в каталоге и сделайте предложение!'
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
                product={{
                  ...product,
                  user_offer_price: product.user_offer_price,
                  user_offer_status: product.user_offer_status,
                  user_offer_created_at: product.user_offer_created_at,
                  user_offer_expires_at: product.user_offer_expires_at
                }}
                batchOffersData={batchOffersData}
                showOfferStatus={true}
                showAuctionInfo={true}
                lastUpdateTime={lastUpdateTime}
                freshDataIndicator={freshDataIndicator}
                forceUpdateCounter={forceUpdateCounter}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
