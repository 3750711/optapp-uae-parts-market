import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Info, MapPin, Eye, DollarSign } from "lucide-react";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import { Badge } from "@/components/ui/badge";
import CompactOffersSummary from "./CompactOffersSummary";
import MobileSellerActions from "./MobileSellerActions";

interface MobileSellerProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  onProductUpdate: () => void;
}

const MobileSellerProductLayout: React.FC<MobileSellerProductLayoutProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  onProductUpdate,
}) => {
const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">Pending Review</Badge>;
      case 'active':
        return <Badge variant="success" className="text-xs">Active</Badge>;
      case 'sold':
        return <Badge variant="info" className="text-xs">Sold</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-xs bg-gray-100">Archived</Badge>;
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
              <h1 className="text-lg font-bold line-clamp-2 text-foreground">{product.title}</h1>
              {getSpecifications() && (
                <p className="text-sm text-muted-foreground mt-1">{getSpecifications()}</p>
              )}
            </div>
            {getStatusBadge()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{product.price} $</span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.view_count || 0}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {product.product_location || "Dubai"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-card mb-2">
        <ProductGallery 
          images={imageUrls}
          videos={videoUrls}
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
        />
      </div>


      {/* Quick Stats */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-lg font-bold text-primary">{product.view_count || 0}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-lg font-bold text-accent">{product.place_number || 1}</div>
              <div className="text-xs text-muted-foreground">Places</div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Product Info */}
      <Card className="rounded-none border-0 shadow-none mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {product.description || "No description available"}
            </p>
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-xs text-muted-foreground">
              Created: {new Date(product.created_at).toLocaleDateString('en-US')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Offers */}
      <CompactOffersSummary productId={product.id} />

      {/* Bottom padding for sticky actions */}
      <div className="h-20"></div>

      {/* Sticky Actions */}
      <MobileSellerActions 
        product={product}
        onProductUpdate={onProductUpdate}
      />
    </div>
  );
};

export default MobileSellerProductLayout;