
import React, { useState } from 'react';
import { Gavel, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeBuyerAuctions, useBuyerOfferCounts } from '@/hooks/useRealtimeBuyerAuctions';
import { useBatchOffers } from '@/hooks/use-price-offers-batch';
import ProductListItem from '@/components/product/ProductListItem';
import { OfferStatusFilter } from '@/components/offers/OfferStatusFilter';
import { RealtimeIndicator } from '@/components/offers/RealtimeIndicator';
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
    freshDataIndicator,
    forceRefresh
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Gavel className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Мои предложения
              </h1>
            </div>
            
            {/* Enhanced Realtime Status Indicator */}
            <RealtimeIndicator
              isConnected={isConnected}
              lastUpdateTime={lastUpdateTime}
              realtimeEvents={realtimeEvents}
              freshDataIndicator={freshDataIndicator}
              onForceRefresh={forceRefresh}
            />
          </div>
          <p className="text-gray-600">
            Управляйте своими предложениями цены и отслеживайте статус торгов
            <span className="text-blue-600 ml-2">
              • {isConnected ? 'Real-time обновления активны' : 'Автообновление каждые 10 сек'}
            </span>
          </p>
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
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
