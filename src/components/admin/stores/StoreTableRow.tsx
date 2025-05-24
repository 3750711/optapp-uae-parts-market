
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';

type StoreWithDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  location: string | null;
  phone: string | null;
  owner_name: string | null;
  rating: number | null;
  verified: boolean;
  created_at: string | null;
  seller_email?: string;
  store_images: {
    id: string;
    url: string;
    is_primary: boolean | null;
  }[];
};

interface StoreTableRowProps {
  store: StoreWithDetails;
  isDeleting: boolean;
  isAdmin: boolean;
  onEdit: (store: StoreWithDetails) => void;
  onDelete: (store: StoreWithDetails) => void;
  deleteStorePending: boolean;
}

const StoreTableRow: React.FC<StoreTableRowProps> = ({
  store,
  isDeleting,
  isAdmin,
  onEdit,
  onDelete,
  deleteStorePending
}) => {
  const getMainImageUrl = (store: StoreWithDetails) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <TableRow className={isDeleting ? 'opacity-50' : ''}>
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
            onClick={() => onEdit(store)}
            disabled={isDeleting}
            title="Редактировать магазин"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(store)}
            className="text-destructive hover:bg-destructive/10"
            disabled={isDeleting || deleteStorePending || !isAdmin}
            title={!isAdmin ? 'Недостаточно прав' : 'Удалить магазин'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default StoreTableRow;
