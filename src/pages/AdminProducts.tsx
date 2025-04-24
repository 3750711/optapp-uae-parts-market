import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { ProductPublishDialog } from '@/components/admin/ProductPublishDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'title' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products', sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary),
          profiles(full_name, rating, opt_id)
        `);

      if (sortField === 'status') {
        query = query.order('status', { ascending: true });
      } else {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      const { data, error } = await query;
      if (error) throw error;

      if (sortField === 'status') {
        const statusOrder = { pending: 0, active: 1, sold: 2, archived: 3 };
        return (data as Product[]).sort((a, b) => 
          statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
        );
      }

      return data as Product[];
    }
  });

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortField(field as 'created_at' | 'price' | 'title' | 'status');
    setSortOrder(order as 'asc' | 'desc');
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteProductId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Успех",
        description: "Товар успешно удален"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
    
    setDeleteProductId(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает проверки';
      case 'active': return 'Опубликован';
      case 'sold': return 'Продан';
      case 'archived': return 'Архив';
      default: return status;
    }
  };

  const getProductCardBackground = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#FEF7CD]';
      case 'active': return 'bg-[#F2FCE2]';
      default: return 'bg-white';
    }
  };

  if (isLoading) {
    return <AdminLayout>
      <div className="flex items-center justify-center h-screen">
        <p>Загрузка...</p>
      </div>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Товары</h1>
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status-asc">Сначала ожидает проверки</SelectItem>
              <SelectItem value="created_at-desc">Сначала новые</SelectItem>
              <SelectItem value="created_at-asc">Сначала старые</SelectItem>
              <SelectItem value="price-desc">Цена по убыванию</SelectItem>
              <SelectItem value="price-asc">Цена по возрастанию</SelectItem>
              <SelectItem value="title-asc">По названию А-Я</SelectItem>
              <SelectItem value="title-desc">По названию Я-А</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products?.map((product) => (
            <div 
              key={product.id} 
              className={`${getProductCardBackground(product.status)} rounded-lg shadow-sm hover:shadow-md transition-shadow p-4`}
            >
              <div className="relative aspect-square mb-4">
                <img 
                  src={product.product_images?.find(img => img.is_primary)?.url || 
                     product.product_images?.[0]?.url || 
                     '/placeholder.svg'} 
                  alt={product.title} 
                  className="object-cover w-full h-full rounded-md"
                />
                <Badge 
                  className={`absolute top-2 right-2 ${getStatusBadgeColor(product.status)}`}
                >
                  {getStatusLabel(product.status)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.price} $
                </p>
                
                {product.delivery_price !== null && product.delivery_price !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Доставка: {product.delivery_price} $
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{product.seller_name}</span>
                  {product.optid_created && (
                    <Badge variant="outline" className="text-xs">
                      {product.optid_created}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <ProductEditDialog
                      product={product}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
                      }}
                    />
                    {product.status === 'pending' && (
                      <ProductPublishDialog
                        product={product}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                          >
                            Опубликовать
                          </Button>
                        }
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
                        }}
                      />
                    )}
                    <ProductStatusDialog
                      product={product}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      }
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
                      }}
                    />
                    <AlertDialog open={deleteProductId === product.id} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setDeleteProductId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удаление товара</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Link to={`/product/${product.id}`} target="_blank">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      Просмотр
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
