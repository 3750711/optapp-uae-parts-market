import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, X, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Separator } from '@/components/ui/separator';

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

const OrderConfirmationStep: React.FC<OrderConfirmationStepProps> = ({
  product,
  seller,
  buyer,
  onConfirm,
  onBack,
  isSubmitting
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
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

  const [originalData, setOriginalData] = useState<EditableData>(editableData);

  const handleEdit = () => {
    setOriginalData({ ...editableData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditableData({ ...originalData });
    setIsEditing(false);
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

  const handleSave = () => {
    if (!validateForm()) return;
    setIsEditing(false);
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

  const updateField = (field: keyof EditableData, value: string | number) => {
    const newData = { ...editableData, [field]: value };
    setEditableData(newData);
  };

  const shouldShowDeliveryPrice = () => {
    return editableData.deliveryMethod === 'cargo_rf' && editableData.deliveryPrice > 0;
  };

  const getTotalPrice = () => {
    return editableData.price + (shouldShowDeliveryPrice() ? editableData.deliveryPrice : 0);
  };

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'cargo_rf': return '🚛 Доставка Cargo РФ';
      case 'self_pickup': return '📦 Самовывоз';
      case 'cargo_kz': return '🚚 Доставка Cargo KZ';
      default: return method;
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Редактирование заказа</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Отменить
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Название товара */}
          <div className="md:col-span-2">
            <Label htmlFor="title">Название товара *</Label>
            <Input
              id="title"
              value={editableData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Введите название товара"
              disabled={isSubmitting}
            />
          </div>

          {/* Бренд */}
          <div>
            <Label htmlFor="brand">Бренд</Label>
            <Input
              id="brand"
              value={editableData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Введите бренд"
              disabled={isSubmitting}
            />
          </div>

          {/* Модель */}
          <div>
            <Label htmlFor="model">Модель</Label>
            <Input
              id="model"
              value={editableData.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Введите модель"
              disabled={isSubmitting}
            />
          </div>

          {/* Цена */}
          <div>
            <Label htmlFor="price">Цена ($) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={editableData.price}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>

          {/* Способ доставки */}
          <div>
            <Label>Способ доставки</Label>
            <Select
              value={editableData.deliveryMethod}
              onValueChange={(value) => updateField('deliveryMethod', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите способ доставки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cargo_rf">🚛 Доставка Cargo РФ</SelectItem>
                <SelectItem value="self_pickup">📦 Самовывоз</SelectItem>
                <SelectItem value="cargo_kz">🚚 Доставка Cargo KZ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Цена доставки */}
          {editableData.deliveryMethod === 'cargo_rf' && (
            <div>
              <Label htmlFor="deliveryPrice">Цена доставки ($)</Label>
              <Input
                id="deliveryPrice"
                type="number"
                min="0"
                step="0.01"
                value={editableData.deliveryPrice}
                onChange={(e) => updateField('deliveryPrice', parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Количество мест */}
          <div>
            <Label htmlFor="placeNumber">Количество мест *</Label>
            <Input
              id="placeNumber"
              type="number"
              min="1"
              value={editableData.placeNumber}
              onChange={(e) => updateField('placeNumber', parseInt(e.target.value) || 1)}
              disabled={isSubmitting}
            />
          </div>

          {/* Дополнительная информация */}
          <div className="md:col-span-2">
            <Label htmlFor="textOrder">Дополнительная информация</Label>
            <Textarea
              id="textOrder"
              value={editableData.textOrder}
              onChange={(e) => updateField('textOrder', e.target.value)}
              placeholder="Укажите дополнительную информацию по заказу"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>

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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Подтверждение заказа</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          disabled={isSubmitting}
        >
          <Edit3 className="h-4 w-4 mr-1" />
          Редактировать
        </Button>
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
              <p className="text-base">{editableData.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Цена:</Label>
              <p className="text-base font-semibold">${editableData.price}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Бренд:</Label>
              <p className="text-base">{editableData.brand || 'Не указан'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Модель:</Label>
              <p className="text-base">{editableData.model || 'Не указана'}</p>
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
              <p className="text-base">{getDeliveryMethodLabel(editableData.deliveryMethod)}</p>
            </div>
            {shouldShowDeliveryPrice() && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Стоимость доставки:</Label>
                <p className="text-base">${editableData.deliveryPrice}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Количество мест:</Label>
              <p className="text-base">{editableData.placeNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Итого:</Label>
              <p className="text-lg font-bold text-primary">${getTotalPrice()}</p>
            </div>
          </div>
          
          {editableData.textOrder && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Дополнительная информация:</Label>
              <p className="text-base mt-1 p-3 bg-muted rounded-md">{editableData.textOrder}</p>
            </div>
          )}
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