import React, { useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useEnhancedProductsState } from '@/hooks/useEnhancedProductsState';
import { useAdminProductsActions } from '@/hooks/useAdminProductsActions';
import ProductModerationCard from '@/components/admin/ProductModerationCard';
import { AlertCircle, Package } from 'lucide-react';
import { useOptimizedFormAutosave } from '@/hooks/useOptimizedFormAutosave';

const AdminProductModeration: React.FC = () => {
  const {
    products,
    isLoading,
    refetch,
    searchTerm,
    debouncedSearchTerm, // Добавляем для передачи в ProductModerationCard
    updateSearchTerm,
    statusFilter,
    setStatusFilter,
    sellerFilter,  
    setSellerFilter,
    selectedProducts,
    setSelectedProducts
  } = useEnhancedProductsState({
    initialFilters: { status: 'pending' }
  });

  // Autosave for mobile browsers - save current state and scroll position
  const { loadSavedData, clearSavedData, saveNow } = useOptimizedFormAutosave({
    key: 'admin_product_moderation',
    data: {
      searchTerm: searchTerm || '',
      statusFilter: statusFilter || 'pending',
      sellerFilter: sellerFilter || '',
      selectedProducts: selectedProducts || [],
      scrollPosition: typeof window !== 'undefined' ? window.scrollY : 0
    },
    delay: 1000,
    enabled: true,
    excludeFields: []
  });

  // Save scroll position periodically  
  const saveScrollPosition = useCallback(() => {
    saveNow({
      searchTerm: searchTerm || '',
      statusFilter: statusFilter || 'pending',
      sellerFilter: sellerFilter || '',
      selectedProducts: selectedProducts || [],
      scrollPosition: window.scrollY
    });
  }, [searchTerm, statusFilter, sellerFilter, selectedProducts, saveNow]);

  // Restore autosaved state on component mount
  useEffect(() => {
    try {
      const saved = loadSavedData();
      if (saved) {
        console.log('✅ Восстановление состояния модерации товаров:', saved);
        
        // Restore filters if they exist and are different from current
        if (saved.searchTerm && saved.searchTerm !== searchTerm && updateSearchTerm) {
          updateSearchTerm(saved.searchTerm);
        }
        if (saved.statusFilter && saved.statusFilter !== statusFilter && setStatusFilter) {
          setStatusFilter(saved.statusFilter);
        }
        if (saved.sellerFilter && saved.sellerFilter !== sellerFilter && setSellerFilter) {
          setSellerFilter(saved.sellerFilter);
        }
        if (saved.selectedProducts && Array.isArray(saved.selectedProducts) && setSelectedProducts) {
          setSelectedProducts(saved.selectedProducts);
        }
        
        // Restore scroll position after a brief delay
        if (saved.scrollPosition && typeof saved.scrollPosition === 'number') {
          setTimeout(() => {
            window.scrollTo(0, saved.scrollPosition);
          }, 100);
        }
        
        console.log('✅ Состояние модерации товаров восстановлено');
      }
    } catch (error) {
      console.error('❌ Ошибка восстановления состояния модерации:', error);
    }
  }, [loadSavedData]);

  // Save immediately on visibility change and page hide (important for mobile)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };
    const onPageHide = () => {
      saveScrollPosition();
    };
    const onScroll = () => {
      // Debounced scroll position saving
      clearTimeout((window as any).scrollSaveTimeout);
      (window as any).scrollSaveTimeout = setTimeout(saveScrollPosition, 1000);
    };
    
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('scroll', onScroll);
    
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('scroll', onScroll);
      if ((window as any).scrollSaveTimeout) {
        clearTimeout((window as any).scrollSaveTimeout);
      }
    };
  }, [saveScrollPosition]);

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
                statusFilter={statusFilter || 'pending'}
                debouncedSearchTerm={debouncedSearchTerm || ''}
                sellerFilter={sellerFilter || 'all'}
                pageSize={12}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductModeration;