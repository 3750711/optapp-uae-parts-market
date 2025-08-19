
import React, { useState } from "react";
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
import EditableOrderForm from "./sell-product/EditableOrderForm";
import { useAuth } from "@/contexts/AuthContext";
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
    editedData?: {
      title: string;
      brand: string;
      model: string;
      price: number;
      deliveryPrice: number;
      placeNumber: number;
      textOrder: string;
    };
  }) => Promise<void>;
  onSave?: (editedData: {
    title: string;
    brand: string;
    model: string;
    price: number;
    deliveryPrice: number;
    placeNumber: number;
    textOrder: string;
    deliveryMethod: string;
  }) => void;
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
  onSave,
  isSubmitting,
  product,
  seller,
  buyer,
  onCancel,
}) => {
  const [savedEditedData, setSavedEditedData] = useState<any>(null);
  const [currentEditedData, setCurrentEditedData] = useState<any>(null);
  const { profile } = useAuth();
  const isSeller = profile?.user_type === 'seller';

  // Translation objects
  const translations = {
    loading: {
      ru: "Загрузка заказа...",
      en: "Loading order..."
    },
    loadingDesc: {
      ru: "Пожалуйста, подождите.",
      en: "Please wait."
    },
    error: {
      ru: "Ошибка",
      en: "Error"
    },
    errorDesc: {
      ru: "Не удалось загрузить информацию о заказе.",
      en: "Failed to load order information."
    },
    confirmTitle: {
      ru: "Подтверждение заказа",
      en: "Order Confirmation"
    },
    confirmDesc: {
      ru: "Проверьте и при необходимости отредактируйте детали заказа перед подтверждением.",
      en: "Review and edit order details if needed before confirmation."
    },
    cancel: {
      ru: "Отменить",
      en: "Cancel"
    },
    orderInfo: {
      ru: "Информация о заказе",
      en: "Order Information"
    },
    orderDetails: {
      ru: "Детали заказа для просмотра.",
      en: "Order details for review."
    },
    close: {
      ru: "Закрыть",
      en: "Close"
    },
    creationDate: {
      ru: "Дата создания:",
      en: "Creation date:"
    },
    deliveryMethod: {
      ru: "Способ доставки:",
      en: "Delivery method:"
    },
    placesCount: {
      ru: "Количество мест:",
      en: "Number of places:"
    },
    seller: {
      ru: "Продавец:",
      en: "Seller:"
    },
    orderSum: {
      ru: "Сумма заказа:",
      en: "Order amount:"
    },
    additionalInfo: {
      ru: "Дополнительная информация:",
      en: "Additional information:"
    },
    sellerInfo: {
      ru: "Информация о продавце:",
      en: "Seller information:"
    },
    buyerInfo: {
      ru: "Информация о покупателе:",
      en: "Buyer information:"
    }
  };

  const t = (key: keyof typeof translations) => {
    return translations[key][isSeller ? 'en' : 'ru'];
  };
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
    deliveryMethod: savedEditedData?.deliveryMethod || 'self_pickup',
    place_number: savedEditedData?.placeNumber ?? product?.place_number ?? 1,
    total_sum: savedEditedData?.price || product?.price || 0,
    text_order: savedEditedData?.title || product?.title || '',
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

  const handleSaveChanges = (editedData: any) => {
    setSavedEditedData(editedData);
    setCurrentEditedData(editedData);
    if (onSave) {
      onSave(editedData);
    }
  };

  const handleDataChange = (editedData: any) => {
    setCurrentEditedData(editedData);
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('loading')}</DialogTitle>
            <DialogDescription>{t('loadingDesc')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || (!displayData && orderId)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('error')}</DialogTitle>
            <DialogDescription>{t('errorDesc')}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Показываем EditableOrderForm для новых заказов (когда есть product, seller, buyer)
  if (product && seller && buyer && onConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('confirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <EditableOrderForm
              product={savedEditedData ? { ...product, ...savedEditedData } : product}
              seller={seller}
              buyer={buyer}
              onConfirm={(orderData) => {
                // Use current edited data if available, otherwise use the data from the form
                const finalOrderData = {
                  ...orderData,
                  editedData: currentEditedData ? {
                    title: currentEditedData.title,
                    brand: currentEditedData.brand,
                    model: currentEditedData.model,
                    price: currentEditedData.price,
                    deliveryPrice: currentEditedData.deliveryPrice,
                    placeNumber: currentEditedData.placeNumber,
                    textOrder: currentEditedData.textOrder
                  } : orderData.editedData
                };
                return onConfirm!(finalOrderData);
              }}
              onSave={handleSaveChanges}
              onDataChange={handleDataChange}
              isSubmitting={isSubmitting || false}
              isSeller={isSeller}
              savedData={savedEditedData}
            />
          </ScrollArea>
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="secondary" onClick={onCancel || handleClose}>
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Оригинальный код для просмотра существующих заказов
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('orderInfo')}</DialogTitle>
          <DialogDescription>
            {t('orderDetails')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[80vh] w-full">
          <div className="flex flex-col space-y-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    {t('creationDate')}{" "}
                    {displayData ? new Date(displayData.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span>{t('deliveryMethod')} {displayData?.deliveryMethod || 'self_pickup'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>{t('placesCount')} {displayData?.place_number || 1}</span>
                </div>
                {(displayData?.profiles || seller) && (
                  <div className="flex items-center space-x-4">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{t('seller')} {displayData?.profiles?.full_name || seller?.full_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>{t('orderSum')} {displayData?.total_sum || product?.price}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span>{t('additionalInfo')} {displayData?.text_order || product?.title}</span>
                </div>
                {(displayData?.profiles || seller) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-bold">{t('sellerInfo')}</div>
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
                      <div className="text-sm font-bold">{t('buyerInfo')}</div>
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

            {displayData?.images && displayData.images.length > 0 && (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {displayData.images.map((image, index) => (
                      <div key={index} className="aspect-w-1 aspect-h-1">
                        <OptimizedImage
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="object-cover rounded-md"
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
          <Button variant="secondary" onClick={handleClose}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderConfirmationDialog;
