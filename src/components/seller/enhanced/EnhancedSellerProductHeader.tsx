import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Eye, Users, TrendingUp, Share2 } from "lucide-react";
import ProductStatusBadge from "@/components/product/ProductStatusBadge";
import { Product } from "@/types/product";

interface EnhancedSellerProductHeaderProps {
  product: Product;
  onBack: () => void;
}

const EnhancedSellerProductHeader: React.FC<EnhancedSellerProductHeaderProps> = ({
  product,
  onBack,
}) => {
  const buildTitle = () => {
    let title = product.title;
    
    if (product.brand && product.model) {
      title = `${title} - ${product.brand} ${product.model}`;
    } else if (product.brand) {
      title = `${title} - ${product.brand}`;
    }
    
    return title;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="mb-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Назад к объявлениям
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Поделиться
        </Button>
      </div>

      {/* Product Title and Main Info */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-2 leading-tight">
              {buildTitle()}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <ProductStatusBadge status={product.status} size="lg" />
              {product.lot_number && (
                <Badge variant="secondary" className="px-3 py-1.5">
                  Лот: {product.lot_number}
                </Badge>
              )}
              <div className="text-3xl font-bold text-primary">
                {product.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Просмотры</p>
              <p className="text-2xl font-bold">{product.view_count || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Предложения</p>
              <p className="text-2xl font-bold">{product.offers_count || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-xl text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Макс. предложение</p>
              <p className="text-2xl font-bold">
                {product.max_offer_price ? `${product.max_offer_price.toLocaleString('ru-RU')} ₽` : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSellerProductHeader;