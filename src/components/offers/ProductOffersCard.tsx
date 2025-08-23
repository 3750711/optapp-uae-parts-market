import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertCircle } from 'lucide-react';
import { GroupedOffer } from '@/hooks/useSellerOffersGrouped';
import { OfferItem } from './OfferItem';
import { PriceOffer } from '@/types/price-offer';
import { formatPrice } from '@/utils/formatPrice';
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

interface ProductOffersCardProps {
  groupedOffer: GroupedOffer;
  onAcceptOffer: (offer: PriceOffer) => void;
  onRejectOffer: (offer: PriceOffer) => void;
}

export const ProductOffersCard: React.FC<ProductOffersCardProps> = ({
  groupedOffer,
  onAcceptOffer,
  onRejectOffer,
}) => {
  const { product, offers, stats } = groupedOffer;
  const hasPendingOffers = stats.pending > 0;
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);

  return (
    <Card className={`${hasPendingOffers ? 'border-yellow-200 bg-yellow-50/10' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Product Image */}
          {product.product_images?.[0] && (
            <img
              src={product.product_images[0].url}
              alt={product.title}
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0"
            />
          )}
          
          {/* Product Info */}
          <div className="flex-1 space-y-2">
            <CardTitle className="text-xl flex items-start gap-2">
              <div>
                <div>{product.title}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {product.brand} {product.model}
                </div>
              </div>
              {hasPendingOffers && (
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
              )}
            </CardTitle>
            
            <div className="text-sm text-muted-foreground">
              {sp.offerElements.originalPrice}: <span className="font-semibold">{formatPrice(product.price)}</span>
            </div>
            
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {stats.total} {sp.offerElements.totalOffers}
          </Badge>
          {stats.pending > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              {stats.pending} {sp.offerStatuses.pending}
            </Badge>
          )}
          {stats.accepted > 0 && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {stats.accepted} {sp.offerStatuses.accepted}
            </Badge>
          )}
          {stats.rejected > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {stats.rejected} {sp.offerStatuses.rejected}
            </Badge>
          )}
          {stats.expired > 0 && (
            <Badge variant="secondary">
              {stats.expired} {sp.offerStatuses.expired}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            {sp.offerElements.priceOffersCount} ({offers.length})
          </h4>
          
          <div className="space-y-3">
            {offers.map((offer) => (
              <OfferItem
                key={offer.id}
                offer={offer}
                onAccept={onAcceptOffer}
                onReject={onRejectOffer}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};