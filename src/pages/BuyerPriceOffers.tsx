
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useBuyerAuctionProducts } from '@/hooks/useBuyerAuctionProducts';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import ProductListItem from '@/components/product/ProductListItem';
import { useBatchOffers } from '@/hooks/use-price-offers-batch';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const { data: auctionProducts, isLoading } = useBuyerAuctionProducts();
  const [searchTerm, setSearchTerm] = useState('');

  // Get batch offers data for optimization
  const productIds = auctionProducts?.map(product => product.id) || [];
  const { data: batchOffersData } = useBatchOffers(productIds);

  if (!user) {
    return <div>Пожалуйста, войдите в систему</div>;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Торги
          </h1>
          <p className="text-gray-600">
            Товары в которых вы участвуете в торгах
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Поиск по товарам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Товары не найдены' : 'Вы пока не участвуете в торгах'}
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
                  brand: product.brand || '',
                  model: product.model || '',
                  condition: product.condition || 'Новое',
                  created_at: product.created_at || new Date().toISOString(),
                  updated_at: product.updated_at || new Date().toISOString(),
                  seller_name: product.seller_name || '',
                  seller_id: product.seller_id || '',
                  status: product.status as 'pending' | 'active' | 'sold' | 'archived',
                  lot_number: product.lot_number || 0,
                  product_images: product.product_images?.map(img => ({
                    id: img.id || '',
                    product_id: img.product_id || product.id,
                    url: img.url,
                    is_primary: img.is_primary || false
                  })) || [],
                  product_videos: product.product_videos?.map(video => ({
                    id: video.id || '',
                    product_id: video.product_id || product.id,
                    url: video.url
                  })) || []
                }}
                batchOffersData={batchOffersData}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
