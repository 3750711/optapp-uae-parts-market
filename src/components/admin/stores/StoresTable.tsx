
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { StoreWithDetails } from '@/hooks/useAdminStores';
import { usePaginatedData } from '@/hooks/usePaginatedData';

interface StoresTableProps {
  stores: StoreWithDetails[];
  onEdit: (store: StoreWithDetails) => void;
  onDelete: (store: StoreWithDetails) => void;
  deletingStoreIds: Set<string>;
  isDeleting: boolean;
}

const StoresTable: React.FC<StoresTableProps> = ({
  stores,
  onEdit,
  onDelete,
  deletingStoreIds,
  isDeleting
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { paginatedData, totalPages } = usePaginatedData(stores, {
    pageSize,
    currentPage
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getMainImageUrl = (store: StoreWithDetails) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Назад
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={1 === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant={totalPages === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Вперед
        </Button>
      </div>
    );
  };

  return (
    <div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Фото</TableHead>
                <TableHead className="min-w-[200px]">Название</TableHead>
                <TableHead className="min-w-[200px]">Адрес</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Владелец</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-20">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((store) => {
                const isDeleting = deletingStoreIds.has(store.id);
                
                return (
                  <TableRow key={store.id} className={isDeleting ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                        <OptimizedImage
                          src={getMainImageUrl(store)}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-2">{store.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Создан: {formatDate(store.created_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="line-clamp-2">{store.address}</div>
                        {store.location && (
                          <div className="text-xs text-muted-foreground">{store.location}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{store.phone || 'Не указан'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{store.owner_name || 'Неизвестно'}</div>
                        <div className="text-xs text-muted-foreground">{store.seller_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{store.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">★</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {store.verified ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          Проверен
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
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
                          onClick={() => onEdit(store)}
                          disabled={isDeleting}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(store)}
                          className="text-destructive hover:bg-destructive/10"
                          disabled={isDeleting || isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {renderPagination()}
    </div>
  );
};

export default StoresTable;
