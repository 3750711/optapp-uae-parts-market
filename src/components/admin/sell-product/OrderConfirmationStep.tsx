import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { InlineEditableField } from '@/components/ui/InlineEditableField';
import { InlineEditableTextarea } from '@/components/ui/InlineEditableTextarea';
import { InlineEditableSelect } from '@/components/ui/InlineEditableSelect';

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  delivery_price?: number;
  place_number?: number;
  product_images?: { url: string; is_primary?: boolean }[];
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

interface OrderConfirmationStepProps {
  product: Product;
  seller: SellerProfile;
  buyer: BuyerProfile;
  onConfirm: (orderData: {
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
  onBack: () => void;
  isSubmitting: boolean;
}

interface EditableData {
  title: string;
  brand: string;
  model: string;
  price: number;
  deliveryPrice: number;
  deliveryMethod: string;
  placeNumber: number;
  textOrder: string;
}

const DELIVERY_OPTIONS = [
  { value: 'cargo_rf', label: '🚛 Доставка Cargo РФ' },
  { value: 'self_pickup', label: '📦 Самовывоз' },
  { value: 'cargo_kz', label: '🚚 Доставка Cargo KZ' }
];

const OrderConfirmationStep: React.FC<OrderConfirmationStepProps> = ({
  product,
  seller,
  buyer,
  onConfirm,
  onBack,
  isSubmitting
}) => {
  const { toast } = useToast();
  const [editableData, setEditableData] = useState<EditableData>({
    title: product.title,
    brand: product.brand || '',
    model: product.model || '',
    price: product.price,
    deliveryPrice: product.delivery_price || 0,
    deliveryMethod: 'cargo_rf',
    placeNumber: product.place_number ?? 1,
    textOrder: ''
  });

  // Field update handlers
  const handleFieldUpdate = async (field: keyof EditableData, value: string | number) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    
    // Show success toast for field updates
    toast({
      title: "Поле обновлено",
      description: "Изменения сохранены",
    });
  };

  const validateForm = (): boolean => {
    if (!editableData.title.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Название товара обязательно для заполнения",
        variant: "destructive",
      });
      return false;
    }

    if (editableData.price <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Цена должна быть больше 0",
        variant: "destructive",
      });
      return false;
    }

    if (editableData.placeNumber <= 0) {
      toast({
        title: "Ошибка валидации",
        description: "Количество мест должно быть больше 0",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleConfirmOrder = async () => {
    if (!validateForm()) return;

    const productImageUrls = product.product_images?.map(img => img.url) || [];
    
    try {
      const orderData = {
        price: editableData.price,
        deliveryPrice: editableData.deliveryPrice,
        deliveryMethod: editableData.deliveryMethod,
        orderImages: productImageUrls,
        editedData: {
          title: editableData.title,
          brand: editableData.brand,
          model: editableData.model,
          price: editableData.price,
          deliveryPrice: editableData.deliveryPrice,
          placeNumber: editableData.placeNumber,
          textOrder: editableData.textOrder
        }
      };
      
      await onConfirm(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const shouldShowDeliveryPrice = () => {
    return editableData.deliveryMethod === 'cargo_rf' && editableData.deliveryPrice > 0;
  };

  const getTotalPrice = () => {
    return editableData.price + (shouldShowDeliveryPrice() ? editableData.deliveryPrice : 0);
  };

  const getDeliveryMethodLabel = (method: string) => {
    const option = DELIVERY_OPTIONS.find(opt => opt.value === method);
    return option?.label || method;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">Информация о заказе</h3>
      </div>

      {/* Информация о товаре */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о товаре</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Название:</Label>
              <InlineEditableField
                value={editableData.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                required
                placeholder="Введите название товара"
                className="text-base font-medium"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Цена:</Label>
              <InlineEditableField
                value={editableData.price}
                onSave={(value) => handleFieldUpdate('price', value)}
                type="price"
                min={0.01}
                step="0.01"
                className="text-base font-semibold"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Бренд:</Label>
              <InlineEditableField
                value={editableData.brand || 'Не указан'}
                onSave={(value) => handleFieldUpdate('brand', value)}
                placeholder="Введите бренд"
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Модель:</Label>
              <InlineEditableField
                value={editableData.model || 'Не указана'}
                onSave={(value) => handleFieldUpdate('model', value)}
                placeholder="Введите модель"
                className="text-base"
              />
            </div>
          </div>

          {/* Изображения товара */}
          {product.product_images && product.product_images.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Медиафайлы товара:</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.product_images.map((image, index) => (
                  <div key={index} className="aspect-square">
                    <OptimizedImage
                      src={image.url}
                      alt={`Товар ${index + 1}`}
                      className="w-full h-full object-cover rounded-md border"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Параметры заказа */}
      <Card>
        <CardHeader>
          <CardTitle>Параметры заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Доставка:</Label>
              <InlineEditableSelect
                value={editableData.deliveryMethod}
                onSave={(value) => handleFieldUpdate('deliveryMethod', value)}
                options={DELIVERY_OPTIONS}
                placeholder="Выберите способ доставки"
                className="text-base"
              />
            </div>
            {editableData.deliveryMethod === 'cargo_rf' && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Стоимость доставки:</Label>
                <InlineEditableField
                  value={editableData.deliveryPrice}
                  onSave={(value) => handleFieldUpdate('deliveryPrice', value)}
                  type="price"
                  min={0}
                  step="0.01"
                  className="text-base"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Количество мест:</Label>
              <InlineEditableField
                value={editableData.placeNumber}
                onSave={(value) => handleFieldUpdate('placeNumber', value)}
                type="number"
                min={1}
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Итого:</Label>
              <p className="text-lg font-bold text-primary">${getTotalPrice()}</p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Дополнительная информация:</Label>
            <InlineEditableTextarea
              value={editableData.textOrder}
              onSave={(value) => handleFieldUpdate('textOrder', value)}
              placeholder="Укажите дополнительную информацию по заказу"
              emptyText="Нажмите, чтобы добавить дополнительную информацию"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Информация об участниках */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Продавец</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Имя:</Label>
              <p className="text-base">{seller.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">OPT ID:</Label>
              <p className="text-base">{seller.opt_id}</p>
            </div>
            {seller.telegram && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telegram:</Label>
                <p className="text-base">{seller.telegram}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Покупатель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Имя:</Label>
              <p className="text-base">{buyer.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">OPT ID:</Label>
              <p className="text-base">{buyer.opt_id}</p>
            </div>
            {buyer.telegram && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telegram:</Label>
                <p className="text-base">{buyer.telegram}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к покупателям
        </Button>
        
        <Button 
          onClick={handleConfirmOrder} 
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Создание заказа...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Создать заказ
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmationStep;