
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
  status: string;
}

interface StoreProductsTabProps {
  sellerProducts?: Product[];
  isProductsLoading: boolean;
  sellerId?: string;
}

const StoreProductsTab: React.FC<StoreProductsTabProps> = ({
  sellerProducts,
  isProductsLoading,
  sellerId
}) => {
  if (isProductsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!sellerProducts || sellerProducts.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <Package className="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        <h3 className="font-medium mb-2">У продавца пока нет объявлений</h3>
        <p className="text-muted-foreground mb-6">Загляните позже, возможно здесь появятся новые товары</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sellerProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <Link 
                  to={`/product/${product.id}`} 
                  className="font-medium hover:text-primary"
                >
                  {product.title}
                </Link>
                <div className="text-sm text-muted-foreground">
                  Цена: {product.price} AED
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/product/${product.id}`}>
                  Просмотреть
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {sellerId && (
        <div className="mt-6 text-right">
          <Button asChild variant="outline">
            <Link to={`/seller/${sellerId}`}>
              <Package className="mr-2" />
              Все объявления продавца
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default StoreProductsTab;
