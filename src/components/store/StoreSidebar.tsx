
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, ShieldCheck } from 'lucide-react';
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

const StoreSidebar: React.FC<StoreSidebarProps> = ({
  store,
  carBrandsData,
  productCount,
  soldProductCount,
  reviewsCount,
  isCountLoading,
  isSoldCountLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store info */}
        <div>
          <h3 className="font-medium mb-1">Адрес</h3>
          <p className="text-muted-foreground">{store.address}</p>
        </div>

        <div>
          <h3 className="font-medium mb-1">Статус</h3>
          <div className="flex items-center">
            {store.verified ? (
              <Badge variant="success" className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Проверено
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                Не проверено
              </Badge>
            )}
          </div>
        </div>

        {/* Product information */}
        <div>
          <h3 className="font-medium mb-1">Объявления</h3>
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>{isCountLoading ? "Загрузка..." : productCount} активных</span>
            </p>
            <p className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              <span>{isSoldCountLoading ? "Загрузка..." : soldProductCount} проданных</span>
            </p>
          </div>
        </div>

        {/* Car brands summary for sidebar */}
        {carBrandsData && carBrandsData.length > 0 && (
          <div>
            <h3 className="font-medium mb-1">Марки автомобилей</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {carBrandsData.map((brand) => (
                <Badge key={brand.id} variant="outline">
                  {brand.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="text-center mb-4">
          <div className="font-medium">{reviewsCount}</div>
          <div className="text-sm text-muted-foreground">отзывов</div>
        </div>

        {/* Button to seller products */}
        <Button asChild className="w-full">
          <Link to={`/seller/${store?.seller_id}`}>
            <Package className="mr-2" />
            Все объявления продавца
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default StoreSidebar;
