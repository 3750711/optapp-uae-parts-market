
import React, { useState } from 'react';
import { Gavel, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyerAuctionProducts } from '@/hooks/useBuyerAuctionProducts';
import { useBatchProductOffers } from '@/hooks/use-price-offers-batch';
import ProductListItem from '@/components/product/ProductListItem';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const { data: auctionProducts, isLoading } = useBuyerAuctionProducts();
  const [searchTerm, setSearchTerm] = useState('');

  // Получаем batch данные для оптимизации
  const productIds = auctionProducts?.map(p => p.id) || [];
  const { data: batchOffersData } = useBatchProductOffers(productIds);

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
          <div className="flex items-center gap-3 mb-2">
            <Gavel className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">
              Торги
            </h1>
          </div>
          <p className="text-gray-600">
            Участвуйте в торгах и управляйте своими предложениями
          </p>
        </div>

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
                {searchTerm ? 'Товары не найдены' : 'Нет активных торгов'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Попробуйте изменить поисковый запрос' 
                  : 'Вы пока не участвуете в торгах. Найдите интересные товары в каталоге и сделайте предложение цены!'
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
                  image: product.cloudinary_url || product.product_images?.[0]?.url || "/placeholder.svg"
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
