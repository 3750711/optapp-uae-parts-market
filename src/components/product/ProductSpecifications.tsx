import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/hooks/useLanguage';
import { getCommonTranslations } from '@/utils/translations/common';

interface ProductSpecificationsProps {
  product: {
    brand?: string;
    model?: string;
    lot_number?: string;
  };
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ product }) => {
  const { language } = useLanguage();
  const c = getCommonTranslations(language);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">{c.product.brand}</h4>
            <p className="text-sm">{product.brand || c.product.notSpecified}</p>
          </div>
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">{c.product.model}</h4>
            <p className="text-sm">{product.model || c.product.notSpecified}</p>
          </div>
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">{c.product.lotNumber}</h4>
            <p className="text-sm font-mono">{product.lot_number || c.product.notSpecified}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSpecifications;