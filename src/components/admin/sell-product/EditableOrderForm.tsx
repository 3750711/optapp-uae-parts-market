
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Edit3, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface EditableOrderFormProps {
  product: {
    id: string;
    title: string;
    price: number;
    brand?: string;
    model?: string;
    delivery_price?: number;
    product_images?: { url: string; is_primary?: boolean }[];
  };
  seller: {
    id: string;
    full_name: string;
    opt_id: string;
  };
  buyer: {
    id: string;
    full_name: string;
    opt_id: string;
  };
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

const EditableOrderForm: React.FC<EditableOrderFormProps> = ({
  product,
  seller,
  buyer,
  onConfirm,
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
    deliveryMethod: 'self_pickup',
    placeNumber: 1,
    textOrder: ''
  });

  const [originalData, setOriginalData] = useState<EditableData>(editableData);

  // Сохранение в localStorage при изменениях
  useEffect(() => {
    if (isEditing) {
      localStorage.setItem('adminSellProduct_editData', JSON.stringify(editableData));
    }
  }, [editableData, isEditing]);

  // Восстановление из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSellProduct_editData');
    if (saved) {
      try {
        const savedData = JSON.parse(saved);
        setEditableData(savedData);
      } catch (error) {
        console.error('Error restoring edit data:', error);
      }
    }
  }, []);

  const handleEdit = () => {
    setOriginalData({ ...editableData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditableData({ ...originalData });
    setIsEditing(false);
    localStorage.removeItem('adminSellProduct_editData');
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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await onConfirm({
        price: editableData.price,
        deliveryPrice: editableData.deliveryPrice,
        deliveryMethod: editableData.deliveryMethod,
        orderImages: product.product_images?.map(img => img.url) || [],
        editedData: {
          title: editableData.title,
          brand: editableData.brand,
          model: editableData.model,
          price: editableData.price,
          deliveryPrice: editableData.deliveryPrice,
          placeNumber: editableData.placeNumber,
          textOrder: editableData.textOrder
        }
      });
      
      setIsEditing(false);
      localStorage.removeItem('adminSellProduct_editData');
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const updateField = (field: keyof EditableData, value: string | number) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
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
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          {/* Цена доставки */}
          <div>
            <Label htmlFor="deliveryPrice">Цена доставки ($)</Label>
            <Input
              id="deliveryPrice"
              type="number"
              min="0"
              step="0.01"
              value={editableData.deliveryPrice}
              onChange={(e) => updateField('deliveryPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
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
                <SelectItem value="self_pickup">📦 Самовывоз</SelectItem>
                <SelectItem value="cargo_rf">🚛 Доставка Cargo РФ</SelectItem>
                <SelectItem value="cargo_kz">🚚 Доставка Cargo KZ</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Медиафайлы товара */}
        {product.product_images && product.product_images.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Медиафайлы товара ({product.product_images.length})</h4>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {product.product_images.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                      <OptimizedImage
                        src={image.url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        size="thumbnail"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Информация об участниках */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Продавец</h4>
            <p className="text-sm text-blue-700">{seller.full_name}</p>
            <p className="text-xs text-blue-600">OPT ID: {seller.opt_id}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Покупатель</h4>
            <p className="text-sm text-green-700">{buyer.full_name}</p>
            <p className="text-xs text-green-600">OPT ID: {buyer.opt_id}</p>
          </div>
        </div>
      </div>
    );
  }

  // Режим просмотра
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Детали заказа</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Информация о товаре</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Название:</span>
              <span className="font-medium">{editableData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Бренд:</span>
              <span className="font-medium">{editableData.brand || 'Не указан'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Модель:</span>
              <span className="font-medium">{editableData.model || 'Не указана'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Цена:</span>
              <span className="font-medium text-green-600">${editableData.price}</span>
            </div>
            {editableData.deliveryPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка:</span>
                <span className="font-medium text-orange-600">${editableData.deliveryPrice}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Параметры заказа</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Доставка:</span>
              <span className="font-medium">
                {editableData.deliveryMethod === 'self_pickup' ? '📦 Самовывоз' :
                 editableData.deliveryMethod === 'cargo_rf' ? '🚛 Cargo РФ' :
                 editableData.deliveryMethod === 'cargo_kz' ? '🚚 Cargo KZ' : editableData.deliveryMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Количество мест:</span>
              <span className="font-medium">{editableData.placeNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Итого:</span>
              <span className="font-bold text-lg text-green-600">
                ${editableData.price + editableData.deliveryPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Медиафайлы товара в режиме просмотра */}
      {product.product_images && product.product_images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Медиафайлы товара ({product.product_images.length})</h4>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {product.product_images.map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                    <OptimizedImage
                      src={image.url}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      size="thumbnail"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

      {editableData.textOrder && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Дополнительная информация</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{editableData.textOrder}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Продавец</h4>
          <p className="text-sm text-blue-700">{seller.full_name}</p>
          <p className="text-xs text-blue-600">OPT ID: {seller.opt_id}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Покупатель</h4>
          <p className="text-sm text-green-700">{buyer.full_name}</p>
          <p className="text-xs text-green-600">OPT ID: {buyer.opt_id}</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => onConfirm({
            price: editableData.price,
            deliveryPrice: editableData.deliveryPrice,
            deliveryMethod: editableData.deliveryMethod,
            orderImages: product.product_images?.map(img => img.url) || []
          })}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? 'Создание заказа...' : 'Подтвердить заказ'}
        </Button>
      </div>
    </div>
  );
};

export default EditableOrderForm;
