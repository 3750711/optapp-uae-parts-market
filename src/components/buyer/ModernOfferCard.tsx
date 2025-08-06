import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface Offer {
  id: string;
  product_id: string;
  original_price: number;
  offered_price: number;
  status: string;
  created_at: string;
  product?: {
    title: string;
    brand: string;
    model: string;
    seller_name: string;
    product_images?: Array<{ url: string; is_primary?: boolean }>;
  };
}

interface ModernOfferCardProps {
  offer: Offer;
}

export const ModernOfferCard: React.FC<ModernOfferCardProps> = ({ offer }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isNew = () => {
    const offerDate = new Date(offer.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return offerDate > threeDaysAgo;
  };

  const primaryImage = offer.product?.product_images?.find(img => img.is_primary)?.url || 
                      offer.product?.product_images?.[0]?.url;

  return (
    <Link to={`/offer/${offer.id}`} className="block group">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
        {/* Image Section - 70% of card */}
        <div className="relative aspect-square bg-slate-100">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={offer.product?.title || 'Товар'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={offer.status} />
          </div>

          {/* New Badge */}
          {isNew() && (
            <div className="absolute top-3 left-3">
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                Новое
              </span>
            </div>
          )}
        </div>

        {/* Content Section - 30% of card */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {offer.product?.title || 'Товар'}
          </h3>
          
          <p className="text-sm text-slate-600">
            {offer.product?.brand} {offer.product?.model}
          </p>
          
          {/* Price Comparison */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Цена продавца:</span>
              <span className="text-slate-700 line-through">
                {formatPrice(offer.original_price)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Ваше предложение:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatPrice(offer.offered_price)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>от {offer.product?.seller_name}</span>
            <span>{formatDate(offer.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};