
import React, { useCallback, useState } from 'react';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import { Product } from '@/types/product';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Search, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { devError, prodError } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminProductsContentProps {
  products: Product[];
  selectedProducts: string[];
  onProductSelect: React.Dispatch<React.SetStateAction<string[]>>;
  onProductUpdate: () => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  searchTerm: string;
  debouncedSearchTerm?: string;
  statusFilter: string;
  sellerFilter: string;
  hasActiveFilters?: boolean;
}

const AdminProductsContent: React.FC<AdminProductsContentProps> = ({
  products,
  selectedProducts,
  onProductSelect,
  onProductUpdate,
  isLoading,
  isError,
  error,
  refetch,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchTerm,
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  hasActiveFilters = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const { toast } = useToast();

  // Детальная обработка ошибок с диагностической информацией
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const isAuthError = errorMessage.includes('permission') || 
                       errorMessage.includes('unauthorized') || 
                       errorMessage.includes('JWT') ||
                       errorMessage.includes('PGRST301');

    // Логируем только критические ошибки
    if (isAuthError) {
      prodError('Authentication error in AdminProductsContent', { errorMessage, statusFilter, sellerFilter });
    } else {
      devError('AdminProductsContent error:', { errorMessage, statusFilter, sellerFilter });
    }

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div className="font-medium">
              {isAuthError ? 'Ошибка доступа' : 'Ошибка загрузки товаров'}
            </div>
            <div className="text-sm">
              {isAuthError ? (
                <div className="space-y-2">
                  <p>Проблема с правами доступа к данным. Возможные причины:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Истек срок действия токена авторизации</li>
                    <li>Недостаточно прав для просмотра товаров</li>
                    <li>Проблема с политиками Row Level Security</li>
                  </ul>
                </div>
              ) : (
                <p>Ошибка: {errorMessage}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => refetch()}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Повторить запрос
              </Button>
              {isAuthError && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Обновить страницу
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Диагностическая информация для админов */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                Техническая информация (для диагностики)
              </summary>
              <div className="space-y-1 font-mono text-xs bg-gray-50 p-2 rounded">
                <div>Ошибка: {errorMessage}</div>
                <div>Тип ошибки: {isAuthError ? 'Authentication/Authorization' : 'General'}</div>
                <div>Фильтры: status={statusFilter}, seller={sellerFilter}</div>
                <div>Поиск: "{debouncedSearchTerm}"</div>
                <div>Время: {new Date().toLocaleTimeString()}</div>
              </div>
            </details>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSingleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    setDeleteProductId(id);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        devError('❌ Error deleting product', error);
        throw error;
      }

      toast({
        title: 'Успешно',
        description: 'Товар удалён',
      });

      onProductSelect((prev) => prev.filter((pid) => pid !== id));
      onProductUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      prodError('Error deleting single product', { id, message });
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  }, [onProductSelect, onProductUpdate, toast]);

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <ProductsGrid
        products={products}
        selectedProducts={selectedProducts}
        onProductSelect={onProductSelect}
        onProductUpdate={onProductUpdate}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
         onDelete={handleSingleDelete}
         isDeleting={isDeleting}
         deleteProductId={deleteProductId}
         onStatusChange={onProductUpdate}
      />
      
      {/* Load More Trigger */}
      {hasNextPage && !isLoading && (
        <LoadMoreTrigger
          onLoadMore={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          hasNextPage={hasNextPage}
        />
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Search className="h-12 w-12 text-gray-300" />
            <div className="text-gray-500 text-lg mb-2">
              {hasActiveFilters ? 'Товары не найдены' : 'Нет товаров'}
            </div>
            <div className="text-gray-400 max-w-md">
              {hasActiveFilters 
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'Начните с добавления первого товара в каталог'
              }
            </div>
            {debouncedSearchTerm && (
              <div className="text-sm text-gray-500 mt-2">
                Поиск по запросу: "<span className="font-medium">{debouncedSearchTerm}</span>"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsContent;
