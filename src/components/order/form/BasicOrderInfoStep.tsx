
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderFormData } from '@/hooks/useOrderForm';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Truck, Hash } from 'lucide-react';

interface BasicOrderInfoStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile?: boolean;
}

const BasicOrderInfoStep: React.FC<BasicOrderInfoStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile = false
}) => {
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");

  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  // Фильтрация брендов по поисковому запросу
  const filteredBrands = useMemo(() => {
    if (!searchBrandTerm) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
    );
  }, [brands, searchBrandTerm]);

  // Фильтрация моделей по поисковому запросу
  const filteredModels = useMemo(() => {
    if (!searchModelTerm) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [brandModels, searchModelTerm]);

  // Обработчик изменения бренда
  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      onInputChange('brandId', brandId);
      onInputChange('brand', brand.name);
      selectBrand(brandId);
      // Сбрасываем модель при смене бренда
      onInputChange('modelId', '');
      onInputChange('model', '');
    }
  };

  // Обработчик изменения модели
  const handleModelChange = (modelId: string) => {
    const model = brandModels.find(m => m.id === modelId);
    if (model) {
      onInputChange('modelId', modelId);
      onInputChange('model', model.name);
    }
  };

  // Синхронизация выбранного бренда с формой
  React.useEffect(() => {
    if (formData.brandId && formData.brandId !== selectedBrand) {
      selectBrand(formData.brandId);
    }
  }, [formData.brandId, selectedBrand, selectBrand]);

  const inputClassName = "transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20";
  const errorClassName = "border-red-300 focus:border-red-500 focus:ring-red-500/20";
  const successClassName = "border-green-300 focus:border-green-500 focus:ring-green-500/20";

  const getInputStatus = (field: string) => {
    const error = getFieldError(field);
    if (error) return 'error';
    if (touchedFields.has(field) && isFieldValid(field)) return 'success';
    return 'default';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Основная информация о товаре */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-blue-600" />
            Информация о товаре
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Наименование *
            </Label>
            <Input 
              id="title" 
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              required 
              placeholder="Введите наименование товара"
              className={`${inputClassName} ${
                getInputStatus('title') === 'error' ? errorClassName :
                getInputStatus('title') === 'success' ? successClassName : ''
              }`}
            />
            {getFieldError('title') && (
              <p className="text-sm text-red-600">{getFieldError('title')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                Бренд
              </Label>
              <Select
                value={formData.brandId}
                onValueChange={handleBrandChange}
                disabled={isLoading}
              >
                <SelectTrigger className={inputClassName}>
                  <SelectValue placeholder="Выберите бренд" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                  {filteredBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                  {filteredBrands.length === 0 && (
                    <div className="py-2 px-3 text-sm text-gray-500">
                      Бренд не найден
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                Модель
              </Label>
              <Select
                value={formData.modelId}
                onValueChange={handleModelChange}
                disabled={isLoading || !formData.brandId}
              >
                <SelectTrigger className={inputClassName}>
                  <SelectValue placeholder={formData.brandId ? "Выберите модель" : "Сначала выберите бренд"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                  {filteredModels.length === 0 && formData.brandId && (
                    <div className="py-2 px-3 text-sm text-gray-500">
                      Модель не найдена
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Цена и дополнительные параметры */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Цена и отправка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-gray-700">
              Цена ($) *
            </Label>
            <div className="relative">
              <DollarSign className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input 
                id="price" 
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => onInputChange('price', e.target.value)}
                required 
                placeholder="0.00"
                className={`pl-10 ${inputClassName} ${
                  getInputStatus('price') === 'error' ? errorClassName :
                  getInputStatus('price') === 'success' ? successClassName : ''
                }`}
              />
            </div>
            {getFieldError('price') && (
              <p className="text-sm text-red-600">{getFieldError('price')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_price" className="text-sm font-medium text-gray-700">
                Стоимость доставки ($)
              </Label>
              <div className="relative">
                <Truck className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input 
                  id="delivery_price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.delivery_price}
                  onChange={(e) => onInputChange('delivery_price', e.target.value)}
                  placeholder="0.00"
                  className={`pl-10 ${inputClassName}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_number" className="text-sm font-medium text-gray-700">
                Количество мест
              </Label>
              <div className="relative">
                <Hash className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input 
                  id="place_number" 
                  type="number"
                  min="1"
                  step="1"
                  value={formData.place_number}
                  onChange={(e) => onInputChange('place_number', e.target.value)}
                  placeholder="1"
                  className={`pl-10 ${inputClassName}`}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buyerOptId" className="text-sm font-medium text-gray-700">
              OPT ID покупателя *
            </Label>
            <Input 
              id="buyerOptId" 
              value={formData.buyerOptId}
              onChange={(e) => onInputChange('buyerOptId', e.target.value)}
              required 
              placeholder="Введите OPT ID получателя"
              className={`${inputClassName} ${
                getInputStatus('buyerOptId') === 'error' ? errorClassName :
                getInputStatus('buyerOptId') === 'success' ? successClassName : ''
              }`}
            />
            {getFieldError('buyerOptId') && (
              <p className="text-sm text-red-600">{getFieldError('buyerOptId')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryMethod" className="text-sm font-medium text-gray-700">
              Способ доставки
            </Label>
            <Select
              value={formData.deliveryMethod}
              onValueChange={(value) => onInputChange('deliveryMethod', value)}
            >
              <SelectTrigger className={inputClassName}>
                <SelectValue placeholder="Выберите способ доставки" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="self_pickup">Самовывоз</SelectItem>
                <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicOrderInfoStep;
