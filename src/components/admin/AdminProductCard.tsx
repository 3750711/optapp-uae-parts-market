
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Bell, Tag, Hash } from "lucide-react";
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { ProductPublishDialog } from '@/components/admin/ProductPublishDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminProductNotifications } from '@/hooks/useAdminProductNotifications';

interface AdminProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onStatusChange?: () => void;
  isSelected?: boolean;
  onSelectToggle?: (productId: string) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({
  product,
  onDelete,
  isDeleting,
  onStatusChange,
  isSelected,
  onSelectToggle
}) => {
  const queryClient = useQueryClient();
  const { sendNotification, isNotificationSending } = useAdminProductNotifications();
  
  const getProductCardBackground = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#FEF7CD]';
      case 'active': return 'bg-[#F2FCE2]';
      default: return 'bg-white';
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

  return (
    <div 
      className={`${getProductCardBackground(product.status)} rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 relative`}
    >
      {onSelectToggle && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(product.id)}
            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
          />
        </div>
      )}
      
      <div className="relative aspect-square mb-4">
        <img 
          src={
            product.product_images?.find(img => img.is_primary)?.url || 
            product.product_images?.[0]?.url || 
            '/placeholder.svg'
          } 
          alt={product.title} 
          className="object-contain w-full h-full rounded-md"
          loading="lazy"
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
              onClick={() => sendNotification(product)}
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
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                  disabled={isDeleting}
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
                  <AlertDialogAction 
                    onClick={() => onDelete(product.id)} 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
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
  );
};

export default AdminProductCard;
