import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { PriceOffer } from "@/types/price-offer";
import { ChevronDown, ChevronUp, ExternalLink, MessageSquare, X, Check } from "lucide-react";
import { useUpdatePriceOffer } from "@/hooks/use-price-offers";

interface AdminPriceOffersTableProps {
  offers: PriceOffer[];
  isLoading: boolean;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const AdminPriceOffersTable: React.FC<AdminPriceOffersTableProps> = ({
  offers,
  isLoading,
  onSort,
  sortField,
  sortDirection
}) => {
  const updateOffer = useUpdatePriceOffer();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      expired: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    const statusLabels = {
      pending: "Ожидает",
      accepted: "Принято",
      rejected: "Отклонено",
      expired: "Истекло",
      cancelled: "Отменено"
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || "outline"}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrimaryImage = (images: any[]) => {
    if (!images || images.length === 0) return null;
    return images.find(img => img.is_primary) || images[0];
  };

  const handleAdminAction = (offerId: string, action: 'accept' | 'reject', response?: string) => {
    updateOffer.mutate({
      offerId: offerId,
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
        seller_response: response
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка предложений...</p>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Предложения не найдены</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <SortableHeader field="buyer_profile.full_name">Покупатель</SortableHeader>
              <SortableHeader field="seller_profile.full_name">Продавец</SortableHeader>
              <SortableHeader field="original_price">Цена товара</SortableHeader>
              <SortableHeader field="offered_price">Предложение</SortableHeader>
              <SortableHeader field="status">Статус</SortableHeader>
              <SortableHeader field="created_at">Создано</SortableHeader>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const primaryImage = getPrimaryImage(offer.product?.product_images || []);
              
              return (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {primaryImage && (
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage 
                            src={primaryImage.url} 
                            alt={offer.product?.title} 
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-md">
                            {offer.product?.title?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">
                          {offer.product?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {offer.product?.brand} {offer.product?.model}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium">{offer.buyer_profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {offer.buyer_profile?.opt_id}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium">{offer.seller_profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {offer.seller_profile?.opt_id}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <p className="font-medium">{formatPrice(offer.original_price)}</p>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-medium text-green-600">{formatPrice(offer.offered_price)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((offer.offered_price / offer.original_price) * 100).toFixed(1)}% от цены
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(offer.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(offer.created_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Истекает: {formatDistanceToNow(new Date(offer.expires_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {offer.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAdminAction(offer.id, 'accept', 'Принято администратором')}
                            disabled={updateOffer.isPending}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAdminAction(offer.id, 'reject', 'Отклонено администратором')}
                            disabled={updateOffer.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {offer.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOffer.mutate({ 
                            offerId: offer.id, 
                            data: { status: 'cancelled' } 
                          })}
                          disabled={updateOffer.isPending}
                        >
                          Отменить
                        </Button>
                      )}
                      
                      {offer.message && (
                        <Button size="sm" variant="ghost" title="Есть сообщение">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {offer.order_id && (
                        <Button size="sm" variant="ghost" title="Перейти к заказу">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};