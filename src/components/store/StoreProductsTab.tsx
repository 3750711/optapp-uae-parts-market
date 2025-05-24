
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
  status: string;
  brand?: string;
  model?: string;
}

interface StoreProductsTabProps {
  sellerProducts?: Product[];
  isProductsLoading: boolean;
  sellerId?: string;
}

const StoreProductsTab: React.FC<StoreProductsTabProps> = memo(({
  sellerProducts,
  isProductsLoading,
  sellerId
}) => {
  if (isProductsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!sellerProducts || sellerProducts.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          У продавца пока нет объявлений
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Загляните позже, возможно здесь появятся новые товары
        </p>
        {sellerId && (
          <Button asChild variant="outline" className="hover:bg-primary/5">
            <Link to={`/seller/${sellerId}`}>
              <Package className="mr-2 h-4 w-4" />
              Перейти к профилю продавца
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        {sellerProducts.map((product, index) => (
          <Card 
            key={product.id} 
            className="group hover:shadow-md transition-all duration-300 border hover:border-primary/30 animate-slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-4">
                  <Link 
                    to={`/product/${product.id}`} 
                    className="block"
                  >
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2">
                      {product.title}
                    </h4>
                  </Link>
                  
                  {/* Brand and model display */}
                  {(product.brand || product.model) && (
                    <p className="text-sm text-muted-foreground mb-2 font-medium">
                      {[product.brand, product.model].filter(Boolean).join(' ')}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-primary">
                      {product.price} $
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="ml-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                >
                  <Link to={`/product/${product.id}`} className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Просмотреть
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {sellerId && (
        <div className="text-center pt-6 border-t border-border">
          <Button 
            asChild 
            variant="default"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Link to={`/seller/${sellerId}`} className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Все объявления продавца
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
});

StoreProductsTab.displayName = 'StoreProductsTab';

export default StoreProductsTab;
