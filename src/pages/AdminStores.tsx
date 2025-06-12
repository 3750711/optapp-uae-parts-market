import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { 
  Table, TableBody, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Store, AlertTriangle, RefreshCw } from 'lucide-react';
import { StoreTag } from '@/types/store';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import StoreTableRow from '@/components/admin/stores/StoreTableRow';
import StoreEditDialog from '@/components/admin/stores/StoreEditDialog';
import StoreDeleteDialog from '@/components/admin/stores/StoreDeleteDialog';
import { useStoreOperations } from '@/hooks/useStoreOperations';

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

const AdminStores = () => {
  const { isAdmin } = useAdminAccess();
  const { deleteStoreMutation, updateStoreMutation, deletingStoreIds } = useStoreOperations(isAdmin);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [editedStore, setEditedStore] = useState<Partial<StoreWithDetails>>({});
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreWithDetails | null>(null);
  
  // Fetch stores with related data и улучшенной обработкой ошибок
  const { data: stores, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      console.log('🔄 Fetching stores data...');
      
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stores:', error);
        throw error;
      }

      console.log('✅ Stores fetched successfully:', storesData?.length || 0, 'stores');

      const storesWithSellerInfo = await Promise.all(
        (storesData || []).map(async (store) => {
          if (!store.seller_id) return { ...store, seller_name: 'Неизвестно', seller_email: 'Неизвестно' };
          
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', store.seller_id)
            .single();
          
          const { data: storeBrands } = await supabase
            .from('store_car_brands')
            .select('car_brand_id, car_brands(id, name)')
            .eq('store_id', store.id);
            
          const { data: storeModels } = await supabase
            .from('store_car_models')
            .select('car_model_id, car_models(id, name, brand_id)')
            .eq('store_id', store.id);
          
          const carBrands = storeBrands?.map(item => item.car_brands) || [];
          const carModels = storeModels?.map(item => item.car_models) || [];
          
          return {
            ...store,
            seller_name: sellerData?.full_name || 'Неизвестно',
            seller_email: sellerData?.email || 'Неизвестно',
            car_brands: carBrands,
            car_models: carModels
          };
        })
      );

      return storesWithSellerInfo as StoreWithDetails[];
    },
    enabled: isAdmin,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: any) => {
      // Не повторяем при ошибках доступа
      if (error?.message?.includes('permission') || error?.code === 'PGRST301') {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Показываем сообщение об отсутствии прав доступа
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

  // Показываем ошибку загрузки с возможностью повтора
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
    console.log('🗑️ Delete button clicked for store:', store.name, 'ID:', store.id);
    console.log('Current admin status:', isAdmin);
    
    if (!isAdmin) {
      console.error('❌ User is not admin');
      toast.error('Недостаточно прав для удаления магазина');
      return;
    }
    
    if (deletingStoreIds.has(store.id)) {
      console.log('⚠️ Store is already being deleted, ignoring click');
      toast.warning('Магазин уже удаляется, пожалуйста подождите');
      return;
    }
    
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStore = () => {
    if (!storeToDelete) {
      console.error('❌ No store selected for deletion');
      toast.error('Ошибка: магазин не выбран для удаления');
      return;
    }
    
    console.log('✅ Confirming deletion for store:', storeToDelete.name, 'ID:', storeToDelete.id);
    
    if (deletingStoreIds.has(storeToDelete.id)) {
      console.log('⚠️ Store is already being deleted');
      toast.warning('Магазин уже удаляется, пожалуйста подождите');
      return;
    }
    
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
      store: editedStore,
      selectedCarBrands,
      selectedCarModels
    });
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

  const filteredStores = stores?.filter(store => !deletingStoreIds.has(store.id)) || [];

  useEffect(() => {
    console.log('Admin access status:', isAdmin);
  }, [isAdmin]);

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление магазинами</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Всего магазинов: {filteredStores.length}
            </div>
            <div className="text-xs text-blue-600">
              Админ: {isAdmin ? 'Да' : 'Нет'}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-4">Загрузка...</div>
            ) : filteredStores.length > 0 ? (
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
                    {filteredStores.map((store) => (
                      <StoreTableRow
                        key={store.id}
                        store={store}
                        isDeleting={deletingStoreIds.has(store.id)}
                        isAdmin={isAdmin}
                        onEdit={handleEditStore}
                        onDelete={handleDeleteStore}
                        deleteStorePending={deleteStoreMutation.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-2 text-lg font-medium">Нет магазинов</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Магазины появятся здесь, когда продавцы их создадут.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
          isDeleting={deleteStoreMutation.isPending}
          isAdmin={isAdmin}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminStores;
