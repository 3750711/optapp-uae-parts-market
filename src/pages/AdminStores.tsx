import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Store, Loader2 } from 'lucide-react';
import { useAdminStores, StoreWithDetails } from '@/hooks/useAdminStores';
import StoreFilters from '@/components/admin/stores/StoreFilters';
import StoresTable from '@/components/admin/stores/StoresTable';
import StoreCards from '@/components/admin/stores/StoreCards';
import StoreEditDialog from '@/components/admin/stores/StoreEditDialog';
import AdminSEO from '@/components/seo/AdminSEO';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminStores = () => {
  const isMobile = useIsMobile();
  const {
    stores,
    isLoading,
    filters,
    setFilters,
    deletingStoreIds,
    deleteStoreMutation,
    updateStoreMutation
  } = useAdminStores();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreWithDetails | null>(null);

  const handleEditStore = (store: StoreWithDetails) => {
    setSelectedStore(store);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStore = (store: StoreWithDetails) => {
    if (deletingStoreIds.has(store.id)) {
      return;
    }
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStore = () => {
    if (!storeToDelete || deletingStoreIds.has(storeToDelete.id)) {
      return;
    }
    deleteStoreMutation.mutate(storeToDelete.id);
    setIsDeleteDialogOpen(false);
    setStoreToDelete(null);
  };

  const handleSaveStore = (data: {
    store: Partial<StoreWithDetails>,
    selectedCarBrands: string[],
    selectedCarModels: {[brandId: string]: string[]}
  }) => {
    updateStoreMutation.mutate(data, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedStore(null);
      }
    });
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedStore(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminSEO 
          title="Управление магазинами" 
          description="Управление магазинами в админ панели OptUAE - редактирование, удаление и модерация"
          section="Магазины"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка магазинов...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminSEO 
        title="Управление магазинами" 
        description="Управление магазинами в админ панели OptUAE - редактирование, удаление и модерация"
        section="Магазины"
      />
      
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление магазинами</h1>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              <StoreFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalStores={stores.length}
                filteredCount={stores.length}
              />

              {stores.length > 0 ? (
                isMobile ? (
                  <StoreCards
                    stores={stores}
                    onEdit={handleEditStore}
                    onDelete={handleDeleteStore}
                    deletingStoreIds={deletingStoreIds}
                    isDeleting={deleteStoreMutation.isPending}
                  />
                ) : (
                  <StoresTable
                    stores={stores}
                    onEdit={handleEditStore}
                    onDelete={handleDeleteStore}
                    deletingStoreIds={deletingStoreIds}
                    isDeleting={deleteStoreMutation.isPending}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Нет магазинов</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filters.search || filters.verified !== 'all' || filters.hasLocation !== 'all'
                      ? 'По заданным фильтрам магазины не найдены.'
                      : 'Магазины появятся здесь, когда продавцы их создадут.'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <StoreEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          store={selectedStore}
          onSave={handleSaveStore}
          isSaving={updateStoreMutation.isPending}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить магазин</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить магазин "{storeToDelete?.name}"? Это действие нельзя отменить.
                Также будут удалены все связанные с магазином данные: изображения, отзывы и связи с марками и моделями автомобилей.
                
                {deleteStoreMutation.isPending && (
                  <div className="mt-2 text-sm text-blue-600">
                    Выполняется удаление, пожалуйста подождите...
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteStoreMutation.isPending}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteStore} 
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteStoreMutation.isPending}
              >
                {deleteStoreMutation.isPending ? 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminStores;
