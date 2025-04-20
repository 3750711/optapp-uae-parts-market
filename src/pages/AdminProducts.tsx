
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Товары</h1>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Изображение</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead>Продавец</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => {
                const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                                     product.product_images?.[0]?.url || 
                                     '/placeholder.svg';
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.lot_number}</TableCell>
                    <TableCell>
                      <div className="w-14 h-14 relative">
                        <img 
                          src={primaryImage} 
                          alt={product.title} 
                          className="object-cover w-full h-full rounded"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>{product.price} AED</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.model}</TableCell>
                    <TableCell>{product.seller_name}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(product.status)}`}>
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                        <Link to={`/product/${product.id}`} target="_blank" className="ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            Просмотр
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
