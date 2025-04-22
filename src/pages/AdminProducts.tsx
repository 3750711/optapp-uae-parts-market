
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary),
          profiles(full_name, rating, opt_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products?.map((product) => {
            const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                               product.product_images?.[0]?.url || 
                               '/placeholder.svg';
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="relative aspect-square mb-4">
                  <img 
                    src={primaryImage} 
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
                    {product.price} AED
                  </p>
                  
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
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
