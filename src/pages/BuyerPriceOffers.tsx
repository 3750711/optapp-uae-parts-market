
import React, { useState } from 'react';
import { Clock, TrendingUp, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuyerPriceOffers } from '@/hooks/use-price-offers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { EnhancedOfferModal } from '@/components/price-offer/EnhancedOfferModal';
import { Product } from '@/types/product';
import { PriceOffer } from '@/types/price-offer';
import Layout from '@/components/layout/Layout';

const BuyerPriceOffers: React.FC = () => {
  const { user } = useAuth();
  const { data: offers, isLoading } = useBuyerPriceOffers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return <div>Пожалуйста, войдите в систему</div>;
  }

  const filteredOffers = offers?.filter(offer => 
    offer.product?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.product?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.product?.model?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditOffer = (offer: PriceOffer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает ответа';
      case 'accepted':
        return 'Принято';
      case 'rejected':
        return 'Отклонено';
      case 'expired':
        return 'Истекло';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'accepted':
        return 'border-green-200 bg-green-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'expired':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

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
            Мои предложения цены
          </h1>
          <p className="text-gray-600">
            Отслеживайте статус ваших предложений и управляйте ими
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

        {filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Предложения не найдены' : 'У вас пока нет предложений'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className={cn("border-2", getStatusColor(offer.status))}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {offer.product?.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {offer.product?.brand} {offer.product?.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(offer.status)}
                      <Badge variant="outline">
                        {getStatusText(offer.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Цена товара:</span>
                        <span className="font-medium">${offer.original_price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ваше предложение:</span>
                        <span className="font-semibold text-green-600">${offer.offered_price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Экономия:</span>
                        <span className="font-medium text-blue-600">
                          ${offer.original_price - offer.offered_price}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Создано:</span>
                        <span className="font-medium">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Истекает:</span>
                        <span className="font-medium">
                          {new Date(offer.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Продавец:</span>
                        <span className="font-medium">
                          {offer.seller_profile?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {offer.status === 'pending' && (
                        <Button
                          onClick={() => handleEditOffer(offer)}
                          size="sm"
                          className="w-full"
                        >
                          Редактировать
                        </Button>
                      )}
                      {offer.message && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Сообщение:</strong> {offer.message}
                        </div>
                      )}
                      {offer.seller_response && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          <strong>Ответ продавца:</strong> {offer.seller_response}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedOffer && (
          <EnhancedOfferModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            product={selectedOffer.product as Product}
            existingOffer={selectedOffer}
            isLeadingBid={false}
            maxOtherOffer={0}
          />
        )}
      </div>
    </Layout>
  );
};

export default BuyerPriceOffers;
