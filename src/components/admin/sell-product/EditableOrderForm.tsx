
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
import { normalizeDecimal } from '@/utils/number';

interface EditableOrderFormProps {
  product: {
    id: string;
    title: string;
    price: number;
    brand?: string;
    model?: string;
    delivery_price?: number;
    place_number?: number;
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
  onDataChange?: (editedData: {
    title: string;
    brand: string;
    model: string;
    price: number;
    deliveryPrice: number;
    placeNumber: number;
    textOrder: string;
    deliveryMethod: string;
  }) => void;
  isSubmitting: boolean;
  isSeller?: boolean;
  savedData?: any;
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
  onSave,
  onDataChange,
  isSubmitting,
  isSeller = false,
  savedData
}) => {
  
  // Translation objects
  const translations = {
    editOrder: {
      ru: "Редактирование заказа",
      en: "Edit Order"
    },
    cancel: {
      ru: "Отменить",
      en: "Cancel"
    },
    save: {
      ru: "Сохранить",
      en: "Save"
    },
    productName: {
      ru: "Название товара *",
      en: "Product Name *"
    },
    productNamePlaceholder: {
      ru: "Введите название товара",
      en: "Enter product name"
    },
    brand: {
      ru: "Бренд",
      en: "Brand"
    },
    brandPlaceholder: {
      ru: "Введите бренд",
      en: "Enter brand"
    },
    model: {
      ru: "Модель",
      en: "Model"
    },
    modelPlaceholder: {
      ru: "Введите модель",
      en: "Enter model"
    },
    price: {
      ru: "Цена ($) *",
      en: "Price ($) *"
    },
    deliveryMethod: {
      ru: "Способ доставки",
      en: "Delivery Method"
    },
    deliveryMethodPlaceholder: {
      ru: "Выберите способ доставки",
      en: "Select delivery method"
    },
    cargoRf: {
      ru: "🚛 Доставка Cargo РФ",
      en: "🚛 Cargo RF Delivery"
    },
    selfPickup: {
      ru: "📦 Самовывоз",
      en: "📦 Self Pickup"
    },
    cargoKz: {
      ru: "🚚 Доставка Cargo KZ",
      en: "🚚 Cargo KZ Delivery"
    },
    deliveryPrice: {
      ru: "Цена доставки ($)",
      en: "Delivery Price ($)"
    },
    placesCount: {
      ru: "Количество мест *",
      en: "Number of Places *"
    },
    additionalInfo: {
      ru: "Дополнительная информация",
      en: "Additional Information"
    },
    additionalInfoPlaceholder: {
      ru: "Укажите дополнительную информацию по заказу",
      en: "Specify additional order information"
    },
    productMedia: {
      ru: "Медиафайлы товара",
      en: "Product Media"
    },
    sellerLabel: {
      ru: "Продавец",
      en: "Seller"
    },
    buyerLabel: {
      ru: "Покупатель",
      en: "Buyer"
    },
    orderDetails: {
      ru: "Детали заказа",
      en: "Order Details"
    },
    edit: {
      ru: "Редактировать",
      en: "Edit"
    },
    productInfo: {
      ru: "Информация о товаре",
      en: "Product Information"
    },
    name: {
      ru: "Название:",
      en: "Name:"
    },
    brandLabel: {
      ru: "Бренд:",
      en: "Brand:"
    },
    modelLabel: {
      ru: "Модель:",
      en: "Model:"
    },
    priceLabel: {
      ru: "Цена:",
      en: "Price:"
    },
    delivery: {
      ru: "Доставка:",
      en: "Delivery:"
    },
    notSpecified: {
      ru: "Не указан",
      en: "Not specified"
    },
    notSpecifiedFemale: {
      ru: "Не указана",
      en: "Not specified"
    },
    orderParams: {
      ru: "Параметры заказа",
      en: "Order Parameters"
    },
    deliveryLabel: {
      ru: "Доставка:",
      en: "Delivery:"
    },
    placesCountLabel: {
      ru: "Количество мест:",
      en: "Number of places:"
    },
    total: {
      ru: "Итого:",
      en: "Total:"
    },
    validationError: {
      ru: "Ошибка валидации",
      en: "Validation Error"
    },
    productNameRequired: {
      ru: "Название товара обязательно для заполнения",
      en: "Product name is required"
    },
    priceRequired: {
      ru: "Цена должна быть больше 0",
      en: "Price must be greater than 0"
    },
    placesRequired: {
      ru: "Количество мест должно быть больше 0",
      en: "Number of places must be greater than 0"
    }
  };

  const t = (key: keyof typeof translations) => {
    return translations[key][isSeller ? 'en' : 'ru'];
  };
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<EditableData>({
    title: savedData?.title || product.title,
    brand: savedData?.brand || product.brand || '',
    model: savedData?.model || product.model || '',
    price: savedData?.price || product.price,
    deliveryPrice: savedData?.deliveryPrice || product.delivery_price || 0,
    deliveryMethod: savedData?.deliveryMethod || 'cargo_rf',
    placeNumber: savedData?.placeNumber ?? product.place_number ?? 1,
    textOrder: savedData?.textOrder || ''
  });

  const [originalData, setOriginalData] = useState<EditableData>(editableData);

  // 📸 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ: Отслеживаем изображения товара
  useEffect(() => {
    console.log("📸 EditableOrderForm - Product images tracking:", {
      product_id: product.id,
      product_images_raw: product.product_images,
      product_images_count: product.product_images?.length || 0,
      product_images_urls: product.product_images?.map(img => img.url) || []
    });
  }, [product]);

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
        title: t('validationError'),
        description: t('productNameRequired'),
        variant: "destructive",
      });
      return false;
    }

    if (editableData.price <= 0) {
      toast({
        title: t('validationError'),
        description: t('priceRequired'),
        variant: "destructive",
      });
      return false;
    }

    if (editableData.placeNumber <= 0) {
      toast({
        title: t('validationError'),
        description: t('placesRequired'),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Save changes without creating order
    if (onSave) {
      onSave({
        title: editableData.title,
        brand: editableData.brand,
        model: editableData.model,
        price: editableData.price,
        deliveryPrice: editableData.deliveryPrice,
        placeNumber: editableData.placeNumber,
        textOrder: editableData.textOrder,
        deliveryMethod: editableData.deliveryMethod
      });
    }
    
    setIsEditing(false);
    localStorage.removeItem('adminSellProduct_editData');
  };

  const handleConfirmOrder = async () => {
    if (!validateForm()) return;

    // 📸 ИСПРАВЛЕНО: Правильно передаем изображения товара
    const productImageUrls = product.product_images?.map(img => img.url) || [];
    
    console.log("📸 EditableOrderForm - handleConfirmOrder - Image transfer:", {
      product_images_raw: product.product_images,
      product_image_urls: productImageUrls,
      product_images_count: productImageUrls.length
    });

    try {
      const orderData = {
        price: editableData.price,
        deliveryPrice: editableData.deliveryPrice,
        deliveryMethod: editableData.deliveryMethod,
        orderImages: productImageUrls, // ✅ ИСПРАВЛЕНО: Передаем изображения товара
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

      console.log("📸 EditableOrderForm - Final orderData being passed:", orderData);
      
      await onConfirm(orderData);
      
      setIsEditing(false);
      localStorage.removeItem('adminSellProduct_editData');
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const updateField = (field: keyof EditableData, value: string | number) => {
    const newData = { ...editableData, [field]: value };
    setEditableData(newData);
    
    // Notify parent component about data changes
    if (onDataChange) {
      onDataChange({
        title: newData.title,
        brand: newData.brand,
        model: newData.model,
        price: newData.price,
        deliveryPrice: newData.deliveryPrice,
        placeNumber: newData.placeNumber,
        textOrder: newData.textOrder,
        deliveryMethod: newData.deliveryMethod
      });
    }
  };

  // Функция для проверки, нужно ли показывать стоимость доставки
  const shouldShowDeliveryPrice = () => {
    return editableData.deliveryMethod === 'cargo_rf' && editableData.deliveryPrice > 0;
  };

  // Функция для расчета итоговой суммы
  const getTotalPrice = () => {
    return editableData.price + (shouldShowDeliveryPrice() ? editableData.deliveryPrice : 0);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('editOrder')}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-1" />
              {t('save')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Название товара */}
          <div className="md:col-span-2">
            <Label htmlFor="title">{t('productName')}</Label>
            <Input
              id="title"
              value={editableData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder={t('productNamePlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          {/* Бренд */}
          <div>
            <Label htmlFor="brand">{t('brand')}</Label>
            <Input
              id="brand"
              value={editableData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder={t('brandPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          {/* Модель */}
          <div>
            <Label htmlFor="model">{t('model')}</Label>
            <Input
              id="model"
              value={editableData.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder={t('modelPlaceholder')}
              disabled={isSubmitting}
            />
          </div>

          {/* Цена */}
          <div>
            <Label htmlFor="price">{t('price')}</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={editableData.price}
              onChange={(e) => updateField('price', normalizeDecimal(e.target.value))}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          {/* Способ доставки */}
          <div>
            <Label>{t('deliveryMethod')}</Label>
            <Select
              value={editableData.deliveryMethod}
              onValueChange={(value) => updateField('deliveryMethod', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('deliveryMethodPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cargo_rf">{t('cargoRf')}</SelectItem>
                <SelectItem value="self_pickup">{t('selfPickup')}</SelectItem>
                <SelectItem value="cargo_kz">{t('cargoKz')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Цена доставки - показываем только для Cargo РФ */}
          {editableData.deliveryMethod === 'cargo_rf' && (
            <div>
              <Label htmlFor="deliveryPrice">{t('deliveryPrice')}</Label>
              <Input
                id="deliveryPrice"
                type="number"
                min="0"
                step="0.01"
                value={editableData.deliveryPrice}
                onChange={(e) => updateField('deliveryPrice', normalizeDecimal(e.target.value))}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Количество мест */}
          <div>
            <Label htmlFor="placeNumber">{t('placesCount')}</Label>
            <Input
              id="placeNumber"
              type="number"
              min="1"
              value={editableData.placeNumber}
              onChange={(e) => updateField('placeNumber', Math.max(1, Math.round(normalizeDecimal(e.target.value))))}
              disabled={isSubmitting}
            />
          </div>

          {/* Дополнительная информация */}
          <div className="md:col-span-2">
            <Label htmlFor="textOrder">{t('additionalInfo')}</Label>
            <Textarea
              id="textOrder"
              value={editableData.textOrder}
              onChange={(e) => updateField('textOrder', e.target.value)}
              placeholder={t('additionalInfoPlaceholder')}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Медиафайлы товара */}
        {product.product_images && product.product_images.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">{t('productMedia')} ({product.product_images.length})</h4>
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
            <h4 className="font-medium text-blue-800 mb-2">{t('sellerLabel')}</h4>
            <p className="text-sm text-blue-700">{seller.full_name}</p>
            <p className="text-xs text-blue-600">OPT ID: {seller.opt_id}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">{t('buyerLabel')}</h4>
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
        <h3 className="text-lg font-semibold">{t('orderDetails')}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          disabled={isSubmitting}
        >
          <Edit3 className="h-4 w-4 mr-1" />
          {t('edit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">{t('productInfo')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('name')}</span>
              <span className="font-medium">{editableData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('brandLabel')}</span>
              <span className="font-medium">{editableData.brand || t('notSpecified')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modelLabel')}</span>
              <span className="font-medium">{editableData.model || t('notSpecifiedFemale')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('priceLabel')}</span>
              <span className="font-medium text-green-600">${editableData.price}</span>
            </div>
            {/* Показываем стоимость доставки только для Cargo РФ и если она больше 0 */}
            {shouldShowDeliveryPrice() && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('delivery')}</span>
                <span className="font-medium text-orange-600">${editableData.deliveryPrice}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">{t('orderParams')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('deliveryLabel')}</span>
              <span className="font-medium">
                {editableData.deliveryMethod === 'self_pickup' ? t('selfPickup') :
                 editableData.deliveryMethod === 'cargo_rf' ? t('cargoRf') :
                 editableData.deliveryMethod === 'cargo_kz' ? t('cargoKz') : editableData.deliveryMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('placesCountLabel')}</span>
              <span className="font-medium">{editableData.placeNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('total')}</span>
              <span className="font-bold text-lg text-green-600">
                ${getTotalPrice()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Медиафайлы товара в режиме просмотра */}
      {product.product_images && product.product_images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">{t('productMedia')} ({product.product_images.length})</h4>
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

      {editableData.textOrder && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{t('additionalInfo')}</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{editableData.textOrder}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">{t('sellerLabel')}</h4>
          <p className="text-sm text-blue-700">{seller.full_name}</p>
          <p className="text-xs text-blue-600">OPT ID: {seller.opt_id}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">{t('buyerLabel')}</h4>
          <p className="text-sm text-green-700">{buyer.full_name}</p>
          <p className="text-xs text-green-600">OPT ID: {buyer.opt_id}</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (isSeller ? 'Creating order...' : 'Создание заказа...') : (isSeller ? 'Confirm Order' : 'Подтвердить заказ')}
        </Button>
      </div>
    </div>
  );
};

export default EditableOrderForm;
