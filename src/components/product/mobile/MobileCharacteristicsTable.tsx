import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Product } from "@/types/product";
import { useLanguage } from '@/hooks/useLanguage';
import { getProductStatusTranslations } from '@/utils/translations/productStatuses';

interface MobileCharacteristicsTableProps {
  product: Product;
}

const MobileCharacteristicsTable: React.FC<MobileCharacteristicsTableProps> = ({
  product,
}) => {
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);
  return (
    <Card className="rounded-none border-0 shadow-none mb-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Характеристики
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Left Column */}
          <div className="space-y-3">
            {product.brand && (
              <div>
                <span className="text-muted-foreground block">Марка:</span>
                <span className="font-medium">{product.brand}</span>
              </div>
            )}
            {product.model && (
              <div>
                <span className="text-muted-foreground block">Модель:</span>
                <span className="font-medium">{product.model}</span>
              </div>
            )}
            {product.lot_number && (
              <div>
                <span className="text-muted-foreground block">Лот:</span>
                <span className="font-medium">{product.lot_number}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground block">Просмотры:</span>
              <span className="font-medium">{product.view_count || 0}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground block">Дата:</span>
              <span className="font-medium">
                {new Date(product.created_at || '').toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Кол-во мест:</span>
              <span className="font-medium">{product.place_number || 1}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Статус:</span>
              <span className="font-medium">
                {product.status === 'active' ? t.statuses.active : 
                 product.status === 'sold' ? t.statuses.sold :
                 product.status === 'pending' ? t.statuses.pending : t.statuses.archived}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCharacteristicsTable;