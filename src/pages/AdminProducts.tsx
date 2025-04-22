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
import { Edit, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

type SortField = 'status' | 'optid_created' | 'created_at';
type SortDirection = 'asc' | 'desc';

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products', sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary),
          profiles(full_name, rating, opt_id)
        `);

      if (sortField === 'status') {
        query = query.order('status', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'optid_created') {
        query = query.order('optid_created', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'created_at') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      }
      
      if (sortField !== 'created_at') {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Товары</h1>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead className="w-[60px]">Фото</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-[80px]">Цена</TableHead>
                <TableHead className="hidden md:table-cell">Бренд</TableHead>
                <TableHead className="hidden md:table-cell">Модель</TableHead>
                <TableHead className="hidden md:table-cell">Продавец</TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('optid_created')}
                    className="h-7 flex items-center gap-1 px-2"
                  >
                    OPT ID
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="h-7 flex items-center gap-1 px-2"
                  >
                    Статус
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('created_at')}
                    className="h-7 flex items-center gap-1 px-2"
                  >
                    Дата
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => {
                const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                                   product.product_images?.[0]?.url || 
                                   '/placeholder.svg';
                
                return (
                  <TableRow key={product.id} className="text-sm">
                    <TableCell className="font-medium py-2">{product.lot_number}</TableCell>
                    <TableCell className="py-2">
                      <div className="w-10 h-10 relative">
                        <img 
                          src={primaryImage} 
                          alt={product.title} 
                          className="object-cover w-full h-full rounded"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 max-w-[200px] truncate">{product.title}</TableCell>
                    <TableCell className="py-2">{product.price} AED</TableCell>
                    <TableCell className="hidden md:table-cell py-2">{product.brand}</TableCell>
                    <TableCell className="hidden md:table-cell py-2">{product.model}</TableCell>
                    <TableCell className="hidden md:table-cell py-2">{product.seller_name}</TableCell>
                    <TableCell className="py-2">
                      {product.optid_created ? (
                        <Badge variant="outline" className="text-xs">{product.optid_created}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`${getStatusBadgeColor(product.status)} text-xs`}>
                        {getStatusLabel(product.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 whitespace-nowrap text-xs">
                      {format(new Date(product.created_at), 'dd.MM.yy HH:mm')}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <ProductEditDialog
                          product={product}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Edit className="h-3 w-3" />
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
                              className="h-7 w-7"
                            >
                              <Eye className="h-3 w-3" />
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
                              className="h-7 w-7 text-red-600"
                              onClick={() => setDeleteProductId(product.id)}
                            >
                              <Trash2 className="h-3 w-3" />
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
                        <Link to={`/product/${product.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
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
