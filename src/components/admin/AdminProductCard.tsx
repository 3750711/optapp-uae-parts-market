import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Tag, Hash, Calendar } from "lucide-react";
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';
import { ProductPublishDialog } from '@/components/admin/ProductPublishDialog';
import { ProductEditDialog } from '@/components/admin/ProductEditDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Product } from '@/types/product';
import { useQueryClient } from '@tanstack/react-query';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface AdminProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onStatusChange?: () => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({
  product,
  onDelete,
  isDeleting,
  onStatusChange
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Исправленная логика: убираем product_url из приоритетов изображений
  const { primaryImage, cloudinaryUrl } = useMemo(() => {
    console.log('🖼️ AdminProductCard processing images for product:', product.id, {
      product_images: product.product_images,
      cloudinary_url: product.cloudinary_url,
      cloudinary_public_id: product.cloudinary_public_id,
      product_image: (product as any).image
    });

    // Приоритет 1: Фото из базы данных (product_images)
    const primaryImg = product.product_images?.find(img => img.is_primary);
    const fallbackImg = product.product_images?.[0];
    
    // Приоритет 2: Cloudinary URL или legacy image поле
    const imageUrl = primaryImg?.url || 
                    fallbackImg?.url || 
                    product.cloudinary_url ||
                    (product as any).image ||
                    '/placeholder.svg';

    const extractedCloudinaryUrl = primaryImg?.url || 
                                  fallbackImg?.url || 
                                  product.cloudinary_url || 
                                  ((product as any).image && (product as any).image.includes('cloudinary.com') ? (product as any).image : null) ||
                                  null;

    console.log('✅ AdminProductCard final image selection:', {
      primaryImageUrl: primaryImg?.url,
      fallbackImageUrl: fallbackImg?.url,
      cloudinaryUrl: product.cloudinary_url,
      productImage: (product as any).image,
      finalImageUrl: imageUrl,
      extractedCloudinaryUrl
    });

    return {
      primaryImage: imageUrl,
      cloudinaryUrl: extractedCloudinaryUrl
    };
  }, [product.product_images, product.cloudinary_url, product.cloudinary_public_id, (product as any).image]);

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

  const formattedCreationDate = product.created_at 
    ? format(new Date(product.created_at), 'dd.MM.yyyy HH:mm')
    : 'Н/Д';

  const brandModelText = [product.brand, product.model]
    .filter(Boolean)
    .join(' • ');

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <div 
        className={`${getProductCardBackground(product.status)} rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full`}
      >
        <div className="relative p-2">
          <AspectRatio ratio={1/1} className="bg-white rounded-md overflow-hidden">
            <OptimizedImage
              src={primaryImage}
              alt={product.title}
              className="w-full h-full object-contain"
              cloudinaryPublicId={product.cloudinary_public_id || undefined}
              cloudinaryUrl={cloudinaryUrl || undefined}
              size="thumbnail"
            />
          </AspectRatio>
          <Badge 
            className={`absolute top-2 right-2 ${getStatusBadgeColor(product.status)}`}
          >
            {getStatusLabel(product.status)}
          </Badge>
        </div>
        
        <div className="p-3 flex-grow flex flex-col">
          <div className="mb-1">
            <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
            
            {brandModelText && (
              <p className="text-xs text-muted-foreground truncate">
                {brandModelText}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <Hash className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Лот: {product.lot_number || 'Не указан'}
            </p>
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Создан: {formattedCreationDate}
            </p>
          </div>
          
          <p className="text-sm font-semibold mb-1">
            {product.price} $
          </p>
          
          {product.delivery_price !== null && product.delivery_price !== undefined && (
            <p className="text-xs text-muted-foreground mb-1">
              Доставка: {product.delivery_price} $
            </p>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-auto">
            <span className="truncate max-w-[100px]">{product.seller_name}</span>
            {product.optid_created && (
              <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">
                {product.optid_created}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 mt-2 border-t pt-2">
            <div className="flex items-center flex-wrap gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              
              <ProductStatusDialog
                product={product}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                }
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
              />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
              
              {product.status === 'pending' && (
                <ProductPublishDialog
                  product={product}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs ml-1"
                    >
                      Опубликовать
                    </Button>
                  }
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
                />
              )}
            </div>
            
            <Link to={`/product/${product.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
              >
                Просмотр
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <ProductEditDialog
        product={product}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={handleEditSuccess}
      />
    </>
  );
};

export default AdminProductCard;
