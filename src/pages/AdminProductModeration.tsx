import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useEnhancedProductsState } from '@/hooks/useEnhancedProductsState';
import { useAdminProductsActions } from '@/hooks/useAdminProductsActions';
import ProductModerationCard from '@/components/admin/ProductModerationCard';
import { AlertCircle, Package } from 'lucide-react';

const AdminProductModeration: React.FC = () => {
  const {
    products,
    isLoading,
    refetch
  } = useEnhancedProductsState({
    initialFilters: { status: 'pending' }
  });

  // Filter for pending products only
  const pendingProducts = products.filter(product => 
    product.status === 'pending'
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Модерация товаров</h1>
          </div>
          <p className="text-muted-foreground">
            Проверка и публикация товаров на модерации
          </p>
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">
              {pendingProducts.length} товаров ожидает модерации
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Загрузка товаров...</p>
          </div>
        ) : pendingProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Нет товаров для модерации</h3>
            <p className="text-muted-foreground">Все товары обработаны</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pendingProducts.map((product) => (
              <ProductModerationCard
                key={product.id}
                product={product}
                onUpdate={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductModeration;