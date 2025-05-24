import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Pencil, Shield, ShieldCheck, ShieldAlert, Store, Car, Check, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StoreTag } from '@/types/store';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { ScrollArea } from '@/components/ui/scroll-area';

// Store types with additional fields needed for the admin view
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
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [editedStore, setEditedStore] = useState<Partial<StoreWithDetails>>({});
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreWithDetails | null>(null);
  
  const { 
    brands: allCarBrands,
    brandModels: allCarModels,
    selectBrand,
    selectedBrand,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();
  
  // Fetch stores with related data
  const { data: stores, isLoading } = useQuery({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      // Fetch stores with their images
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stores:', error);
        throw error;
      }

      // Fetch seller information for each store
      const storesWithSellerInfo = await Promise.all(
        (storesData || []).map(async (store) => {
          if (!store.seller_id) return { ...store, seller_name: 'Неизвестно', seller_email: 'Неизвестно' };
          
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', store.seller_id)
            .single();
          
          // Fetch car brands and models associated with this store
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
    enabled: isAdmin
  });

  // Enhanced delete store mutation with detailed logging
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      console.log('🔥 DELETION PROCESS STARTED');
      console.log('Store ID to delete:', storeId);
      console.log('Current user admin status:', isAdmin);
      
      try {
        // Check admin status first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
        console.log('Profile check result:', { profile, profileError });
        
        if (profileError || profile?.user_type !== 'admin') {
          throw new Error('Недостаточно прав для удаления магазина');
        }
        
        console.log('✅ Admin rights confirmed');
        
        // Check if store exists before deletion
        const { data: storeExists, error: checkError } = await supabase
          .from('stores')
          .select('id, name')
          .eq('id', storeId)
          .single();
          
        console.log('Store existence check:', { storeExists, checkError });
        
        if (checkError || !storeExists) {
          throw new Error('Магазин не найден или уже удален');
        }
        
        console.log('✅ Store exists, proceeding with deletion');
        
        // Call the admin function to delete store safely
        console.log('🚀 Calling admin_delete_store RPC function...');
        const { data, error } = await supabase
          .rpc('admin_delete_store', { p_store_id: storeId });
        
        console.log('RPC function response:', { data, error });
        
        if (error) {
          console.error('❌ RPC function error:', error);
          throw new Error(`Ошибка функции удаления: ${error.message}`);
        }
        
        if (data !== true) {
          console.error('❌ RPC function returned unexpected result:', data);
          throw new Error('Функция удаления вернула неожиданный результат');
        }
        
        console.log('✅ Store deletion completed successfully');
        return storeId;
      } catch (error: any) {
        console.error('💥 Error in store deletion process:', error);
        
        // More detailed error information
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.details) {
          console.error('Error details:', error.details);
        }
        if (error.hint) {
          console.error('Error hint:', error.hint);
        }
        
        throw error;
      }
    },
    onSuccess: (deletedStoreId) => {
      console.log('🎉 Store deletion successful for ID:', deletedStoreId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      toast.success('Магазин успешно удален');
      setIsDeleteDialogOpen(false);
      setStoreToDelete(null);
    },
    onError: (error: any) => {
      console.error('💀 Store deletion failed:', error);
      
      // Show detailed error message to user
      const errorMessage = error.message || 'Неизвестная ошибка при удалении магазина';
      toast.error(`Ошибка при удалении магазина: ${errorMessage}`);
      
      // Log additional error details for debugging
      console.error('Full error object:', error);
    }
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (store: Partial<StoreWithDetails>) => {
      // Update store basic info
      const { error } = await supabase
        .from('stores')
        .update({
          name: store.name,
          description: store.description,
          address: store.address,
          location: store.location,
          phone: store.phone,
          owner_name: store.owner_name,
          tags: store.tags,
          verified: store.verified,
          telegram: store.telegram
        })
        .eq('id', store.id);

      if (error) throw error;
      
      // Update car brands
      if (selectedCarBrands.length > 0) {
        // First delete existing associations
        await supabase
          .from('store_car_brands')
          .delete()
          .eq('store_id', store.id);
          
        // Then add new associations
        const brandInserts = selectedCarBrands.map(brandId => ({
          store_id: store.id,
          car_brand_id: brandId
        }));
        
        const { error: brandError } = await supabase
          .from('store_car_brands')
          .insert(brandInserts);
          
        if (brandError) throw brandError;
      }
      
      // Update car models
      // First delete existing associations
      await supabase
        .from('store_car_models')
        .delete()
        .eq('store_id', store.id);
        
      // Then add new associations
      const modelInserts: {store_id: string, car_model_id: string}[] = [];
      
      Object.keys(selectedCarModels).forEach(brandId => {
        selectedCarModels[brandId].forEach(modelId => {
          modelInserts.push({
            store_id: store.id!,
            car_model_id: modelId
          });
        });
      });
      
      if (modelInserts.length > 0) {
        const { error: modelError } = await supabase
          .from('store_car_models')
          .insert(modelInserts);
          
        if (modelError) throw modelError;
      }
      
      return store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      toast.success('Данные магазина обновлены');
      handleCloseEditDialog();
    },
    onError: (error) => {
      console.error('Error updating store:', error);
      toast.error('Ошибка при обновлении магазина');
    }
  });

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
    
    // Initialize selected car brands and models
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
    console.log('Store data:', store);
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStore = () => {
    if (storeToDelete) {
      console.log('✅ Confirming deletion for store:', storeToDelete.name, 'ID:', storeToDelete.id);
      console.log('Admin status:', isAdmin);
      console.log('Mutation pending status:', deleteStoreMutation.isPending);
      
      deleteStoreMutation.mutate(storeToDelete.id);
    } else {
      console.error('❌ No store selected for deletion');
      toast.error('Ошибка: магазин не выбран для удаления');
    }
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
    updateStoreMutation.mutate(editedStore);
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
        // If removing a brand, also remove all its models
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

  const getMainImageUrl = (store: StoreWithDetails) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  const availableTags: { value: StoreTag; label: string }[] = [
    { value: 'electronics', label: 'Электроника' },
    { value: 'auto_parts', label: 'Автозапчасти' },
    { value: 'accessories', label: 'Аксессуары' },
    { value: 'spare_parts', label: 'Запчасти' },
    { value: 'other', label: 'Другое' }
  ];
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление магазинами</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Всего магазинов: {stores?.length || 0}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-4">Загрузка...</div>
            ) : stores && stores.length > 0 ? (
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
                      <TableRow key={store.id}>
                        <TableCell>
                          <div className="w-12 h-12 relative">
                            <img
                              src={getMainImageUrl(store)}
                              alt={store.name}
                              className="rounded-md object-cover w-full h-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Создан: {formatDate(store.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{store.address}</div>
                          <div className="text-xs text-muted-foreground">{store.location}</div>
                        </TableCell>
                        <TableCell>{store.phone || 'Не указан'}</TableCell>
                        <TableCell>
                          <div>{store.owner_name || 'Неизвестно'}</div>
                          <div className="text-xs text-muted-foreground">{store.seller_email}</div>
                        </TableCell>
                        <TableCell>{store.rating?.toFixed(1) || '-'}</TableCell>
                        <TableCell>
                          {store.verified ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Проверен
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Не проверен
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStore(store)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStore(store)}
                              className="text-destructive hover:bg-destructive/10"
                              disabled={deleteStoreMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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

        {/* Edit Store Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать магазин</DialogTitle>
              <DialogDescription>
                Внесите изменения в информацию о магазине.
              </DialogDescription>
            </DialogHeader>

            {selectedStore && (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Название магазина</label>
                    <Input
                      value={editedStore.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Описание</label>
                    <Textarea
                      value={editedStore.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Адрес</label>
                      <Input
                        value={editedStore.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Город</label>
                      <Input
                        value={editedStore.location || ''}
                        onChange={(e) => handleChange('location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Телефон</label>
                      <Input
                        value={editedStore.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Имя владельца</label>
                      <Input
                        value={editedStore.owner_name || ''}
                        onChange={(e) => handleChange('owner_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Телеграм</label>
                    <Input
                      value={editedStore.telegram || ''}
                      onChange={(e) => handleChange('telegram', e.target.value)}
                      placeholder="username или https://t.me/username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Теги</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <div key={tag.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.value}`}
                            checked={(editedStore.tags || []).includes(tag.value)}
                            onCheckedChange={() => handleToggleTag(tag.value)}
                          />
                          <label
                            htmlFor={`tag-${tag.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {tag.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Car Brands Selection */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <h3 className="text-sm font-medium">Марки и модели автомобилей</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Выберите марки и модели автомобилей, с которыми работает этот магазин
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {allCarBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand.id}`}
                            checked={selectedCarBrands.includes(brand.id)}
                            onCheckedChange={() => handleToggleCarBrand(brand.id)}
                          />
                          <label
                            htmlFor={`brand-${brand.id}`}
                            className="text-sm font-medium leading-none"
                          >
                            {brand.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Car Models Selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Модели автомобилей</label>
                      {selectedCarBrands.length > 0 && (
                        <Select 
                          value={selectedBrandForModels || ''} 
                          onValueChange={(value) => {
                            setSelectedBrandForModels(value);
                            selectBrand(value);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Выберите марку" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCarBrands.map(brandId => {
                              const brand = allCarBrands.find(b => b.id === brandId);
                              return brand ? (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ) : null;
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {selectedBrandForModels && (
                      <div className="border rounded-md p-2">
                        {isBrandsLoading ? (
                          <div className="text-center py-2">Загрузка моделей...</div>
                        ) : allCarModels.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {allCarModels.map((model) => (
                              <div key={model.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`model-${model.id}`}
                                  checked={(selectedCarModels[selectedBrandForModels] || []).includes(model.id)}
                                  onCheckedChange={() => handleToggleCarModel(model.id, selectedBrandForModels)}
                                />
                                <label
                                  htmlFor={`model-${model.id}`}
                                  className="text-sm leading-none"
                                >
                                  {model.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            Нет доступных моделей для этой марки
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!selectedBrandForModels && selectedCarBrands.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Выберите марку для отображения моделей
                      </div>
                    )}
                    
                    {selectedCarBrands.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        Сначала выберите хотя бы одну марку автомобиля
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={editedStore.verified}
                      onCheckedChange={(checked) => handleChange('verified', !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="verified"
                        className="text-sm font-medium leading-none flex items-center gap-1"
                      >
                        <Shield className="h-4 w-4" />
                        Проверенный магазин
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Проверенные магазины отображаются с отметкой проверки
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEditDialog}>
                Отмена
              </Button>
              <Button onClick={handleSaveStore}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Delete Store Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Удалить магазин
              </AlertDialogTitle>
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
