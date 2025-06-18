
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Truck, Package, User, DollarSign, MessageSquare, MapPin, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Product } from "@/types/product";

interface OrderData {
  id: string;
  created_at: string;
  deliveryMethod: string;
  place_number: number;
  total_sum: number;
  text_order: string;
  images?: string[];
  videos?: string[];
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
    opt_id: string;
    location: string;
    telegram: string;
  };
}

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface AdminOrderConfirmationDialogProps {
  orderId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onConfirm?: (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
  product?: Product;
  seller?: SellerProfile;
  buyer?: BuyerProfile;
  onCancel?: () => void;
}

const AdminOrderConfirmationDialog: React.FC<AdminOrderConfirmationDialogProps> = ({
  orderId,
  open,
  onOpenChange,
  onClose,
  onConfirm,
  isSubmitting,
  product,
  seller,
  buyer,
  onCancel,
}) => {
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles (
            full_name,
            email,
            phone,
            opt_id,
            location,
            telegram
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        throw new Error("Failed to fetch order");
      }

      return data as OrderData;
    },
    enabled: open && !!orderId,
  });

  // If we have direct props (product, seller, buyer), use them instead of fetching
  const displayData = orderId ? order : {
    id: product?.id || '',
    created_at: new Date().toISOString(),
    deliveryMethod: 'self_pickup',
    place_number: 1,
    total_sum: product?.price || 0,
    text_order: product?.title || '',
    images: product?.product_images?.map(img => img.url) || [],
    videos: [],
    profiles: seller ? {
      full_name: seller.full_name,
      email: '',
      phone: '',
      opt_id: seller.opt_id,
      location: '',
      telegram: seller.telegram || ''
    } : undefined
  };

  // Get primary image with enhanced cloudinary support and debugging
  const getPrimaryImage = () => {
    console.log('🖼️ Getting primary image for product:', {
      productId: product?.id,
      productImages: product?.product_images,
      cloudinaryPublicId: product?.cloudinary_public_id,
      cloudinaryUrl: product?.cloudinary_url
    });

    if (!product?.product_images || product.product_images.length === 0) {
      console.log('❌ No product images found');
      return null;
    }
    
    const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
    
    console.log('✅ Primary image found:', {
      imageUrl: primaryImage.url,
      isPrimary: primaryImage.is_primary,
      productCloudinaryPublicId: product.cloudinary_public_id,
      productCloudinaryUrl: product.cloudinary_url
    });
    
    return {
      url: primaryImage.url,
      cloudinaryPublicId: product.cloudinary_public_id || null,
      cloudinaryUrl: product.cloudinary_url || null
    };
  };

  const handleConfirm = async () => {
    if (onConfirm && product) {
      // Validate data before confirming
      if (!product.price || product.price <= 0) {
        console.error('Invalid product price:', product.price);
        return;
      }

      console.log('✅ Confirming order with validated data:', {
        price: product.price,
        deliveryPrice: product.delivery_price,
        images: product.product_images?.map(img => img.url) || [],
        cloudinaryData: {
          publicId: product.cloudinary_public_id,
          url: product.cloudinary_url
        }
      });

      await onConfirm({
        price: product.price,
        deliveryPrice: product.delivery_price,
        deliveryMethod: 'self_pickup',
        orderImages: product.product_images?.map(img => img.url) || []
      });
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Загрузка заказа...</DialogTitle>
            <DialogDescription>Пожалуйста, подождите.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || (!displayData && orderId)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
            <DialogDescription>Не удалось загрузить информацию о заказе.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const primaryImageData = getPrimaryImage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Подтверждение заказа</DialogTitle>
          <DialogDescription>
            Проверьте детали заказа перед подтверждением.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[80vh] w-full">
          <div className="flex flex-col space-y-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    Дата создания:{" "}
                    {displayData ? new Date(displayData.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span>Способ доставки: {displayData?.deliveryMethod || 'self_pickup'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>Количество мест: {displayData?.place_number || 1}</span>
                </div>
                {(displayData?.profiles || seller) && (
                  <div className="flex items-center space-x-4">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Продавец: {displayData?.profiles?.full_name || seller?.full_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Сумма заказа: ${displayData?.total_sum || product?.price}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span>Дополнительная информация: {displayData?.text_order || product?.title}</span>
                </div>
                {(displayData?.profiles || seller) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-bold">Информация о продавце:</div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{displayData?.profiles?.full_name || seller?.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{displayData?.profiles?.location || 'Dubai'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{displayData?.profiles?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span>{displayData?.profiles?.telegram || seller?.telegram}</span>
                      </div>
                    </div>
                  </>
                )}
                {buyer && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-bold">Информация о покупателе:</div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{buyer.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span>{buyer.telegram}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Product image with enhanced cloudinary support */}
            {primaryImageData && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-bold mb-2">Изображение товара:</div>
                  <div className="w-full max-w-md mx-auto">
                    <OptimizedImage
                      src={primaryImageData.url}
                      alt={product?.title || 'Product image'}
                      className="w-full h-64 object-cover rounded-md"
                      cloudinaryPublicId={primaryImageData.cloudinaryPublicId}
                      cloudinaryUrl={primaryImageData.cloudinaryUrl}
                      size="detail"
                      priority={false}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {displayData?.images && displayData.images.length > 1 && (
              <Card>
                <CardContent>
                  <div className="text-sm font-bold mb-2">Дополнительные изображения:</div>
                  <div className="grid grid-cols-3 gap-4">
                    {displayData.images.slice(1).map((image, index) => (
                      <div key={index} className="aspect-w-1 aspect-h-1">
                        <OptimizedImage
                          src={image}
                          alt={`Image ${index + 2}`}
                          className="object-cover rounded-md"
                          size="thumbnail"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {displayData?.videos && displayData.videos.length > 0 && (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {displayData.videos.map((video, index) => (
                      <video key={index} src={video} controls className="rounded-md" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={onCancel || handleClose}>
            Отменить
          </Button>
          {onConfirm && (
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Подтвердить заказ'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderConfirmationDialog;
