
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ShieldCheck, ShieldAlert, MapPin, Phone, User, Calendar } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { StoreWithDetails } from '@/hooks/useAdminStores';

interface StoreCardsProps {
  stores: StoreWithDetails[];
  onEdit: (store: StoreWithDetails) => void;
  onDelete: (store: StoreWithDetails) => void;
  deletingStoreIds: Set<string>;
  isDeleting: boolean;
}

const StoreCards: React.FC<StoreCardsProps> = ({
  stores,
  onEdit,
  onDelete,
  deletingStoreIds,
  isDeleting
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getMainImageUrl = (store: StoreWithDetails) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => {
        const isDeleting = deletingStoreIds.has(store.id);
        
        return (
          <Card key={store.id} className={`transition-all ${isDeleting ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                  <OptimizedImage
                    src={getMainImageUrl(store)}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium line-clamp-2">{store.name}</h3>
                    {store.verified ? (
                      <Badge variant="default" className="flex items-center gap-1 ml-2">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="hidden sm:inline">Проверен</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 ml-2">
                        <ShieldAlert className="w-3 h-3" />
                        <span className="hidden sm:inline">Не проверен</span>
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{store.address}</span>
                    </div>
                    
                    {store.location && (
                      <div className="text-xs">{store.location}</div>
                    )}

                    {store.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{store.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span>{store.owner_name || 'Неизвестно'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(store.created_at)}</span>
                    </div>

                    {store.rating && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{store.rating.toFixed(1)}</span>
                        <span>★</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(store)}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(store)}
                      className="text-destructive hover:bg-destructive/10"
                      disabled={isDeleting || isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StoreCards;
