
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, ShieldCheck, MapPin, Phone, Star, TrendingUp } from 'lucide-react';
import { StoreWithImages } from '@/types/store';

interface CarBrand {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

interface StoreSidebarProps {
  store: StoreWithImages;
  carBrandsData?: CarBrand[];
  productCount: number;
  soldProductCount: number;
  reviewsCount: number;
  isCountLoading: boolean;
  isSoldCountLoading: boolean;
}

const StoreSidebar: React.FC<StoreSidebarProps> = memo(({
  store,
  carBrandsData,
  productCount,
  soldProductCount,
  reviewsCount,
  isCountLoading,
  isSoldCountLoading
}) => {
  return (
    <Card className="sticky top-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          Информация о магазине
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store basic info */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Адрес
              </h3>
              <p className="text-foreground leading-relaxed">{store.address}</p>
            </div>
          </div>

          {store.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">
                  Телефон
                </h3>
                <p className="text-foreground">{store.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Статус
              </h3>
              {store.verified ? (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                  <ShieldCheck className="w-3 h-3" />
                  Проверено
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1 text-amber-700 border-amber-200">
                  Не проверено
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="font-bold text-lg text-foreground">
              {isCountLoading ? "..." : productCount}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Активных
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="font-bold text-lg text-foreground">
              {isSoldCountLoading ? "..." : soldProductCount}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Продано
            </div>
          </div>
        </div>

        {/* Reviews count */}
        <div className="text-center p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="font-bold text-lg text-foreground">
            {reviewsCount}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Отзывов
          </div>
        </div>

        {/* Car brands summary */}
        {carBrandsData && carBrandsData.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Марки автомобилей
              </h3>
              <div className="flex flex-wrap gap-2">
                {carBrandsData.slice(0, 3).map((brand) => (
                  <Badge key={brand.id} variant="secondary" className="text-xs">
                    {brand.name}
                  </Badge>
                ))}
                {carBrandsData.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{carBrandsData.length - 3} еще
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* CTA Button */}
        <Button 
          asChild 
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Link to={`/seller/${store?.seller_id}`} className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Все объявления продавца
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
});

StoreSidebar.displayName = 'StoreSidebar';

export default StoreSidebar;
