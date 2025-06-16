
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { 
  Table, TableBody, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Store, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { StoreTag } from '@/types/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import StoreTableRow from '@/components/admin/stores/StoreTableRow';
import StoreEditDialog from '@/components/admin/stores/StoreEditDialog';
import StoreDeleteDialog from '@/components/admin/stores/StoreDeleteDialog';
import OptimizedStoreFilters from '@/components/admin/stores/OptimizedStoreFilters';
import StorePagination from '@/components/admin/stores/StorePagination';
import { useOptimizedAdminStores } from '@/hooks/useOptimizedAdminStores';
import { useOptimizedStoreOperations } from '@/components/admin/stores/OptimizedStoreOperations';

type StoreWithDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  location: string | null;
  phone: string | null;
  owner_name: string | null;
  rating: number | null;
  tags: StoreTag[] | null;
  verified: boolean;
  telegram: string | null;
  created_at: string | null;
  updated_at: string | null;
  seller_id: string | null;
  store_images: {
    id: string;
    url: string;
    is_primary: boolean | null;
  }[];
  seller_name?: string;
  seller_email?: string;
  car_brands?: { id: string; name: string }[];
  car_models?: { id: string; name: string; brand_id: string }[];
};

const OptimizedAdminStores = () => {
  const { isAdmin } = useAdminAccess();
  
  // Filters and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'name' | 'verified'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const pageSize = 20;
  
  // Fetch optimized stores data
  const {
    data: stores,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    totalPages,
    isLoading,
    isSearching,
    error,
    refetch
  } = useOptimizedAdminStores({
    page: currentPage,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    verifiedFilter
  });
  
  // Store operations
  const { 
    deleteStoreMutation, 
    updateStoreMutation, 
    deletingStoreIds,
    operationInProgress,
    isDeletePending,
    isUpdatePending
  } = useOptimizedStoreOperations(isAdmin);
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [editedStore, setEditedStore] = useState<Partial<StoreWithDetails>>({});
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreWithDetails | null>(null);

  // Reset to first page when filters change
  const handleFilterChange = (newPage = 1) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    handleFilterChange(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort as any);
    handleFilterChange(1);
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    handleFilterChange(1);
  };

  const handleVerifiedFilterChange = (filter: 'all' | 'verified' | 'unverified') => {
    setVerifiedFilter(filter);
    handleFilterChange(1);
  };

  // Show access denied for non-admins
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              У вас нет прав для просмотра магазинов. Требуются права администратора.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  // Show error with retry option
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление магазинами</h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Ошибка загрузки магазинов: {error.message}</span>
              <Button 
                onClick={() => refetch()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  const handleEditStore = async (store: StoreWithDetails) => {
    setSelectedStore(store);
    setEditedStore({
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      location: store.location,
      phone: store.phone,
      owner_name: store.owner_name,
      tags: store.tags || [],
      verified: store.verified,
      telegram: store.telegram
    });
    
    const storeBrands = store.car_brands?.map(brand => brand.id) || [];
    setSelectedCarBrands(storeBrands);
    
    const modelsByBrand: {[brandId: string]: string[]} = {};
    store.car_models?.forEach(model => {
      if (!modelsByBrand[model.brand_id]) {
        modelsByBrand[model.brand_id] = [];
      }
      modelsByBrand[model.brand_id].push(model.id);
    });
    setSelectedCarModels(modelsByBrand);
    
    setIsEditDialogOpen(true);
  };

  const handleDeleteStore = (store: StoreWithDetails) => {
    if (!isAdmin || operationInProgress.has(store.id)) {
      return;
    }
    
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStore = () => {
    if (!storeToDelete) return;
    
    deleteStoreMutation.mutate(storeToDelete.id);
    setIsDeleteDialogOpen(false);
    setStoreToDelete(null);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedStore(null);
    setEditedStore({});
    setSelectedCarBrands([]);
    setSelectedCarModels({});
    setSelectedBrandForModels(null);
  };

  const handleSaveStore = () => {
    if (!editedStore.id) return;
    
    updateStoreMutation.mutate({
      ...editedStore,
      selectedCarBrands,
      selectedCarModels
    } as any);
    
    handleCloseEditDialog();
  };

  const handleChange = (key: keyof StoreWithDetails, value: any) => {
    setEditedStore(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleTag = (tag: StoreTag) => {
    const currentTags = editedStore.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleChange('tags', newTags);
  };

  const handleToggleCarBrand = (brandId: string) => {
    setSelectedCarBrands(prev => {
      if (prev.includes(brandId)) {
        setSelectedCarModels(prevModels => {
          const newModels = { ...prevModels };
          delete newModels[brandId];
          return newModels;
        });
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  const handleToggleCarModel = (modelId: string, brandId: string) => {
    setSelectedCarModels(prev => {
      const currentBrandModels = prev[brandId] || [];
      
      if (currentBrandModels.includes(modelId)) {
        return {
          ...prev,
          [brandId]: currentBrandModels.filter(id => id !== modelId)
        };
      } else {
        return {
          ...prev,
          [brandId]: [...currentBrandModels, modelId]
        };
      }
    });
  };

  const getStoreMetrics = () => {
    const verified = stores.filter(store => store.verified).length;
    const unverified = stores.filter(store => !store.verified).length;
    const avgRating = stores.reduce((sum, store) => sum + (store.rating || 0), 0) / stores.length;
    
    return { verified, unverified, avgRating: avgRating.toFixed(1) };
  };

  const metrics = getStoreMetrics();

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header with metrics */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление магазинами</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Всего магазинов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Проверенные</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.verified}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Не проверенные</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.unverified}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Средний рейтинг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {metrics.avgRating}
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <OptimizedStoreFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          verifiedFilter={verifiedFilter}
          onVerifiedFilterChange={handleVerifiedFilterChange}
          totalCount={totalCount}
          isSearching={isSearching}
        />

        {/* Content */}
        <Card>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Загрузка магазинов...</p>
              </div>
            ) : stores.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Изображение</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Адрес</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Владелец</TableHead>
                        <TableHead>Рейтинг</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map((store) => (
                        <StoreTableRow
                          key={store.id}
                          store={store}
                          isDeleting={deletingStoreIds.has(store.id)}
                          isAdmin={isAdmin}
                          onEdit={handleEditStore}
                          onDelete={handleDeleteStore}
                          deleteStorePending={isDeletePending || operationInProgress.has(store.id)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <StorePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasNextPage={hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                  onPageChange={setCurrentPage}
                  totalCount={totalCount}
                  pageSize={pageSize}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <Store className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-2 text-lg font-medium">Нет магазинов</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim() ? 'По вашему запросу ничего не найдено.' : 'Магазины появятся здесь, когда продавцы их создадут.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <StoreEditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          store={selectedStore}
          editedStore={editedStore}
          selectedCarBrands={selectedCarBrands}
          selectedCarModels={selectedCarModels}
          selectedBrandForModels={selectedBrandForModels}
          onClose={handleCloseEditDialog}
          onSave={handleSaveStore}
          onChange={handleChange}
          onToggleTag={handleToggleTag}
          onToggleCarBrand={handleToggleCarBrand}
          onToggleCarModel={handleToggleCarModel}
          onSelectBrandForModels={setSelectedBrandForModels}
        />

        <StoreDeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          store={storeToDelete}
          onConfirm={confirmDeleteStore}
          isDeleting={isDeletePending}
          isAdmin={isAdmin}
        />
      </div>
    </AdminLayout>
  );
};

export default OptimizedAdminStores;
