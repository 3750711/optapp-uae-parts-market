import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Info, MapPin, Eye, DollarSign } from "lucide-react";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import { Badge } from "@/components/ui/badge";
import CompactOffersSummary from "./CompactOffersSummary";
import MobileSellerActions from "./MobileSellerActions";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";

interface MobileSellerProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  showAddNewButton?: boolean;
}

const MobileSellerProductLayout: React.FC<MobileSellerProductLayoutProps> = React.memo(({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  showAddNewButton = false,
}) => {
  // Ensure we have a valid product before using hooks
  if (!product?.id) {
    return null;
  }

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

  const getSpecifications = () => {
    const specs = [];
    if (product.brand) specs.push(product.brand);
    if (product.model) specs.push(product.model);
    if (product.lot_number) specs.push(`Lot #${product.lot_number}`);
    return specs.join(' • ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold line-clamp-2 text-foreground mb-1">
                  {product.title}
                </h1>
                {getSpecifications() && (
                  <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                    {product.brand && (
                      <span className="text-sm text-muted-foreground">{product.brand}</span>
                    )}
                    {product.model && (
                      <>
                        <span>•</span>
                        <span className="text-sm text-muted-foreground">{product.model}</span>
                      </>
                    )}
                    {product.lot_number && (
                      <>
                        <span>•</span>
                        <span className="text-sm text-muted-foreground">Lot #{product.lot_number}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {getStatusBadge()}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-primary">
                ${product.price}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {product.status !== 'pending' && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-blue-500" />
                    {product.tg_views_estimate || 0}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {product.product_location || "Dubai"}
                  </span>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-card mb-2">
        {imageUrls.length > 0 || videoUrls.length > 0 ? (
          <ProductGallery 
            images={imageUrls}
            videos={videoUrls}
            title={product.title}
            selectedImage={selectedImage} 
            onImageClick={onImageClick}
          />
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No images available</span>
          </div>
        )}
      </div>


      {/* Quick Stats */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardContent className="p-4">
          <div className={`grid gap-4 ${product.status === 'pending' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {product.status !== 'pending' && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-lg font-bold text-primary flex items-center gap-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  {product.tg_views_estimate || 0}
                </div>
                <div className="text-xs text-muted-foreground">{t.labels.tgViews}</div>
              </div>
            )}
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-lg font-bold text-primary">{product.place_number || 1}</div>
              <div className="text-xs text-muted-foreground">{t.labels.places}</div>
            </div>
          </div>
          {product.delivery_price !== null && product.delivery_price !== undefined && (
            <div className="mt-4 bg-muted p-3 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">{t.labels.deliveryPrice}</div>
              <div className="text-lg font-bold text-secondary">
                ${product.delivery_price}
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Product Info */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t.labels.productDescription}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {product.description || "No description available"}
            </div>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">
              {t.labels.created}: {new Date(product.created_at).toLocaleDateString('en-US')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Offers */}
      <CompactOffersSummary productId={product.id} />


      {/* Sticky Actions */}
      <MobileSellerActions 
        product={product}
        showAddNewButton={showAddNewButton}
      />
    </div>
  );
});

export default MobileSellerProductLayout;