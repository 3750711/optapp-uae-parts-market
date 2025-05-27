
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, User, UserCheck, DollarSign, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";

interface AdminOrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orderData: { 
    price: number; 
    deliveryPrice?: number; 
    deliveryMethod: string;
    orderImages: string[];
  }) => void;
  isSubmitting: boolean;
  product: {
    id: string;
    title: string;
    price: number;
    brand?: string;
    model?: string;
    lot_number: number;
    delivery_price?: number;
    product_images?: { url: string; is_primary?: boolean }[];
  };
  seller: {
    id: string;
    full_name: string;
    opt_id: string;
    telegram?: string;
  };
  buyer: {
    id: string;
    full_name: string;
    opt_id: string;
    telegram?: string;
  };
  onCancel: () => void;
}

const AdminOrderConfirmationDialog: React.FC<AdminOrderConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  product,
  seller,
  buyer,
  onCancel,
}) => {
  const [price, setPrice] = useState(product.price.toString());
  const [deliveryPrice, setDeliveryPrice] = useState(product.delivery_price?.toString() || "0");
  const [deliveryMethod, setDeliveryMethod] = useState("cargo_rf");
  const [orderImages, setOrderImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleConfirm = () => {
    const numPrice = parseFloat(price);
    const numDeliveryPrice = parseFloat(deliveryPrice);
    
    if (isNaN(numPrice) || numPrice <= 0) {
      return;
    }

    console.log("Order confirmation data:", {
      price: numPrice,
      deliveryPrice: numDeliveryPrice > 0 ? numDeliveryPrice : undefined,
      deliveryMethod,
      orderImages
    });

    onConfirm({
      price: numPrice,
      deliveryPrice: numDeliveryPrice > 0 ? numDeliveryPrice : undefined,
      deliveryMethod,
      orderImages
    });
  };

  const handleImagesUpload = (urls: string[]) => {
    console.log("Images uploaded:", urls);
    setOrderImages(urls);
  };

  const handleImageDelete = (urlToDelete: string) => {
    console.log("Deleting image:", urlToDelete);
    setOrderImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Подтверждение создания заказа</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте и отредактируйте данные заказа перед созданием
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4 text-sm">
            {/* Информация о товаре с фотографиями */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Информация о товаре</h3>
              </div>
              
              {/* Фотографии товара */}
              {product.product_images && product.product_images.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {product.product_images.slice(0, 6).map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <OptimizedImage
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          priority={index === 0}
                        />
                        {image.is_primary && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                            Главное
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {product.product_images.length > 6 && (
                    <p className="text-xs text-gray-600 mt-2">
                      +{product.product_images.length - 6} фото
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Наименование:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{product.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Бренд:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Модель:</span>
                  <span className="font-medium">{product.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Номер лота:</span>
                  <span className="font-medium">{product.lot_number}</span>
                </div>
                
                {/* Редактируемая цена */}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="price">Цена товара ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Дополнительные фотографии заказа */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Дополнительные фотографии заказа</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showImageUpload ? 'Скрыть' : 'Добавить фото'}
                </Button>
              </div>

              {/* Отображение загруженных дополнительных фотографий */}
              {orderImages.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {orderImages.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img
                          src={imageUrl}
                          alt={`Order image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageDelete(imageUrl)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Удалить изображение"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Дополнительных фотографий: {orderImages.length}
                  </p>
                </div>
              )}

              {/* Компонент загрузки изображений */}
              {showImageUpload && (
                <div className="mt-3">
                  <MobileOptimizedImageUpload
                    onUploadComplete={handleImagesUpload}
                    maxImages={15}
                    storageBucket="order-images"
                    existingImages={orderImages}
                    onImageDelete={handleImageDelete}
                  />
                </div>
              )}
            </div>

            {/* Способ доставки и стоимость */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Доставка</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="deliveryMethod">Способ доставки</Label>
                  <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cargo_rf">Cargo РФ</SelectItem>
                      <SelectItem value="cargo_kz">Cargo KZ</SelectItem>
                      <SelectItem value="self_pickup">Самовывоз</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="deliveryPrice">Стоимость доставки ($)</Label>
                  <Input
                    id="deliveryPrice"
                    type="number"
                    value={deliveryPrice}
                    onChange={(e) => setDeliveryPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Информация о продавце */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Информация о продавце</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Продавец:</span>
                  <span className="font-medium">{seller.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">OPT ID:</span>
                  <span className="font-medium">{seller.opt_id}</span>
                </div>
                {seller.telegram && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Telegram:</span>
                    <span className="font-medium">@{seller.telegram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Информация о покупателе */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Информация о покупателе</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Покупатель:</span>
                  <span className="font-medium">{buyer.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">OPT ID:</span>
                  <span className="font-medium">{buyer.opt_id}</span>
                </div>
                {buyer.telegram && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Telegram:</span>
                    <span className="font-medium">@{buyer.telegram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Итоговая стоимость */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-gray-700">Итого к оплате:</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${formatPrice((parseFloat(price) || 0) + (parseFloat(deliveryPrice) || 0))}
                  </div>
                  {parseFloat(deliveryPrice) > 0 && (
                    <div className="text-sm text-gray-600">
                      товар: ${formatPrice(parseFloat(price) || 0)} + доставка: ${formatPrice(parseFloat(deliveryPrice) || 0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Кнопки */}
        <DialogFooter className="flex sm:justify-end justify-between gap-3 mt-4 pt-0 px-0 flex-shrink-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Начать заново
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting || !price || parseFloat(price) <= 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              "Создать заказ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderConfirmationDialog;
