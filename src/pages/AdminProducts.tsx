import React, { useState, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Bell, Tag, Hash, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { ProductPublishDialog } from '@/components/admin/ProductPublishDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useIntersection } from '@/hooks/useIntersection';

const PRODUCTS_PER_PAGE = 20;

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'title' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNotificationSending, setIsNotificationSending] = useState<Record<string, boolean>>({});
  
  // Reference for the loading trigger element
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Using the intersection observer to detect when user scrolls to the bottom
  const isIntersecting = useIntersection(loadMoreRef, '200px');
  
  const {
    data: productsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage
  } = useInfiniteQuery({
    queryKey: ['admin', 'products', sortField, sortOrder, searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      // Calculate the start and end range for pagination
      const from = (pageParam - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary),
          profiles(full_name, rating, opt_id)
        `);

      // Apply search filter if search query exists
      if (searchQuery) {
        const searchTermLower = searchQuery.toLowerCase().trim();
        query = query
          .or(`title.ilike.%${searchTermLower}%,brand.ilike.%${searchTermLower}%,model.ilike.%${searchTermLower}%,lot_number.ilike.%${searchTermLower}%,seller_name.ilike.%${searchTermLower}%`);
      }

      if (sortField === 'status') {
        query = query.order('status', { ascending: true });
      } else {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      // Apply pagination
      query = query.range(from, to);
      
      const { data, error } = await query;
      if (error) throw error;

      // Check if we have more pages
      const hasMore = data.length === PRODUCTS_PER_PAGE;

      if (sortField === 'status') {
        const statusOrder = { pending: 0, active: 1, sold: 2, archived: 3 };
        return {
          products: (data as Product[]).sort((a, b) => 
            statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
          ),
          nextPage: hasMore ? pageParam + 1 : undefined
        };
      }

      return {
        products: data as Product[],
        nextPage: hasMore ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  // Flatten the pages of products into a single array
  const products = productsData?.pages?.flatMap(page => page.products) || [];

  // Filter products based on search query (client-side filtering for already loaded products)
  const filteredProducts = searchQuery ? products.filter(product => {
    const query = searchQuery.toLowerCase().trim();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.model?.toLowerCase().includes(query) ||
      product.lot_number?.toString().includes(query) ||
      product.seller_name?.toLowerCase().includes(query)
    );
  }) : products;

  // Load more products when the user scrolls to the bottom
  React.useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  const handleSendNotification = async (product: Product) => {
    try {
      setIsNotificationSending({...isNotificationSending, [product.id]: true});
      
      // First, get a fresh product with all images
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', product.id)
        .single();

      if (fetchError || !freshProduct) {
        throw new Error(fetchError?.message || 'Failed to fetch product details');
      }
      
      // Now call the edge function with the complete product data
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { product: freshProduct }
      });
      
      if (error) {
        console.error('Error calling function:', error);
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        toast({
          title: "Успех",
          description: "Уведомление отправлено в Telegram",
        });
      } else {
        toast({
          title: "Внимание",
          description: (data && data.message) || "Уведомление не было отправлено",
          variant: "destructive", 
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsNotificationSending({...isNotificationSending, [product.id]: false});
    }
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
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts?.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500">
              Товары не найдены
            </div>
          ) : (
            filteredProducts?.map((product) => (
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
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Лот: {product.lot_number || 'Не указан'}
                    </p>
                  </div>
                  
                  {(product.brand || product.model) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Tag className="w-3 h-3" />
                      <span>
                        {product.brand || 'Не указано'} • {product.model || 'Не указано'}
                      </span>
                    </p>
                  )}
                  
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
                        <>
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
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleSendNotification(product)}
                        disabled={isNotificationSending[product.id]}
                        title="Отправить уведомление в Telegram"
                      >
                        <Bell className={`h-4 w-4 ${isNotificationSending[product.id] ? 'animate-pulse' : ''}`} />
                      </Button>
                      
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
                    <Link to={`/product/${product.id}`}>
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
            ))
          )}
        </div>
        
        {/* Loading indicator and intersection observer target */}
        {hasNextPage && (
          <div 
            ref={loadMoreRef}
            className="w-full py-8 flex items-center justify-center"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Загрузка...</span>
              </div>
            ) : (
              <div className="h-10"></div> // Empty space to trigger the intersection
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
