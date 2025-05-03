
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Pencil, Shield, ShieldCheck, ShieldAlert, Store 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StoreTag } from '@/types/store';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
};

const AdminStores = () => {
  const { isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [editedStore, setEditedStore] = useState<Partial<StoreWithDetails>>({});
  
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
          
          return {
            ...store,
            seller_name: sellerData?.full_name || 'Неизвестно',
            seller_email: sellerData?.email || 'Неизвестно'
          };
        })
      );

      return storesWithSellerInfo as StoreWithDetails[];
    },
    enabled: isAdmin
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (store: Partial<StoreWithDetails>) => {
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

  const handleEditStore = (store: StoreWithDetails) => {
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
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedStore(null);
    setEditedStore({});
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStore(store)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать магазин</DialogTitle>
              <DialogDescription>
                Внесите изменения в информацию о магазине.
              </DialogDescription>
            </DialogHeader>

            {selectedStore && (
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
      </div>
    </AdminLayout>
  );
};

export default AdminStores;
