import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Eye, Calendar } from "lucide-react";
import { Product } from "@/types/product";
import { InlineEditableField } from "@/components/ui/InlineEditableField";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";

interface SellerProductInfoProps {
  product: Product;
  updatePrice: (value: string | number) => Promise<void>;
  updatePlaceNumber: (value: string | number) => Promise<void>;
  updateDeliveryPrice: (value: string | number) => Promise<void>;
}

const SellerProductInfo: React.FC<SellerProductInfoProps> = ({
  product,
  updatePrice,
  updatePlaceNumber,
  updateDeliveryPrice,
}) => {
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">{t.statuses.pending}</Badge>;
      case 'active':
        return <Badge variant="success" className="text-xs">{t.statuses.active}</Badge>;
      case 'sold':
        return <Badge variant="info" className="text-xs">{t.statuses.sold}</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-xs bg-gray-100">{t.statuses.archived}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t.labels.productInformation}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            {t.labels.price}
          </div>
          <InlineEditableField
            value={product.price}
            onSave={updatePrice}
            type="price"
            suffix=" $"
            displayClassName="text-2xl font-bold text-primary"
            placeholder="0"
            required
            min={0}
            step="1"
          />
        </div>

        {/* Places */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="h-4 w-4" />
            {t.labels.numberOfPlaces}
          </div>
          <InlineEditableField
            value={product.place_number || 1}
            onSave={updatePlaceNumber}
            type="number"
            displayClassName="text-lg font-semibold text-primary"
            placeholder="1"
            min={1}
            required
          />
        </div>

        {/* Delivery Price */}
        {product.delivery_price !== null && product.delivery_price !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              {t.labels.deliveryPrice}
            </div>
            <InlineEditableField
              value={product.delivery_price}
              onSave={updateDeliveryPrice}
              type="price"
              suffix=" $"
              displayClassName="text-lg font-semibold text-secondary"
              placeholder="0"
              min={0}
              step="1"
              disabled={product.status === 'active'}
              disabledMessage="Cannot change delivery price for published products"
            />
          </div>
        )}

        {/* Views */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            {t.labels.views}
          </div>
          <div className="text-lg font-semibold text-foreground">
            {product.view_count || 0}
          </div>
        </div>

        {/* Creation Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {t.labels.created}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(product.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerProductInfo;