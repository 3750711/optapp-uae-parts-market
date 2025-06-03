import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderFormData, SellerProfile, ProfileShort, DeliveryMethod } from "./types";
import { Package } from "lucide-react";
import SellerProductsDialog from "./SellerProductsDialog";
import { toast } from "@/hooks/use-toast";

interface OrderFormFieldsProps {
  formData: OrderFormData;
  handleInputChange: (field: string, value: string) => void;
  buyerProfiles: ProfileShort[];
  sellerProfiles: SellerProfile[];
  selectedSeller: SellerProfile | null;
  // Car brand and model props
  brands: { id: string; name: string }[];
  brandModels: { id: string; name: string; brand_id: string }[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: { id: string; name: string }[];
  filteredModels: { id: string; name: string; brand_id: string }[];
  // Add new prop for title parsing
  parseTitleForBrand: (title: string) => void;
  // Add new props for handling images and data from product
  onImagesUpload?: (urls: string[]) => void;
  onDataFromProduct?: (data: any) => void;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  lot_number: number;
  delivery_price?: number;
  place_number?: number;
  product_images?: { url: string; is_primary?: boolean }[];
}

export const OrderFormFields: React.FC<OrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  buyerProfiles,
  sellerProfiles,
  selectedSeller,
  // Car brand and model props
  brands,
  brandModels,
  isLoadingCarData,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  filteredBrands,
  filteredModels,
  // Add new prop for title parsing
  parseTitleForBrand,
  // Add new props for handling images and data from product
  onImagesUpload,
  onDataFromProduct,
}) => {
  const [showProductsDialog, setShowProductsDialog] = useState(false);

  // Sort buyer profiles by opt_id alphabetically
  const sortedBuyerProfiles = [...buyerProfiles].sort((a, b) => {
    const optIdA = a.opt_id || '';
    const optIdB = b.opt_id || '';
    return optIdA.localeCompare(optIdB);
  });

  // Sort seller profiles by opt_id alphabetically
  const sortedSellerProfiles = [...sellerProfiles].sort((a, b) => {
    const optIdA = a.opt_id || '';
    const optIdB = b.opt_id || '';
    return optIdA.localeCompare(optIdB);
  });

  const handleAddDataFromProduct = () => {
    if (!selectedSeller) {
      toast({
        title: "Внимание",
        description: "Сначала выберите продавца",
        variant: "destructive",
      });
      return;
    }
    setShowProductsDialog(true);
  };

  const handleProductSelect = (product: Product) => {
    console.log("Selected product:", product);

    // Обновляем поля формы данными из товара
    handleInputChange('title', product.title);
    handleInputChange('price', product.price.toString());
    
    if (product.brand) {
      // Найти ID бренда по имени
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand?.toLowerCase());
      if (brandObj) {
        handleInputChange('brandId', brandObj.id);
      }
    }
    
    if (product.model) {
      // Найти ID модели по имени
      const modelObj = brandModels.find(m => m.name.toLowerCase() === product.model?.toLowerCase());
      if (modelObj) {
        handleInputChange('modelId', modelObj.id);
      }
    }

    if (product.delivery_price) {
      handleInputChange('delivery_price', product.delivery_price.toString());
    }

    if (product.place_number) {
      handleInputChange('place_number', product.place_number.toString());
    }

    // Копируем изображения товара
    if (product.product_images && product.product_images.length > 0 && onImagesUpload) {
      const imageUrls = product.product_images.map(img => img.url);
      onImagesUpload(imageUrls);
    }

    // Вызываем парсинг названия для автозаполнения бренда/модели
    parseTitleForBrand(product.title);

    // Передаем данные в родительский компонент, если нужно
    if (onDataFromProduct) {
      onDataFromProduct(product);
    }

    toast({
      title: "Данные скопированы",
      description: `Данные из товара "${product.title}" успешно добавлены в форму`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Наименование *</Label>
          {selectedSeller && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDataFromProduct}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Добавить данные из объявления
            </Button>
          )}
        </div>
        <Input 
          id="title" 
          value={formData.title}
          onChange={(e) => {
            handleInputChange('title', e.target.value);
            // Call the parse function when title changes
            parseTitleForBrand(e.target.value);
          }}
          required 
          placeholder="Введите наименование"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brandId">Бренд</Label>
          <Select
            value={formData.brandId}
            onValueChange={(value) => handleInputChange('brandId', value)}
            disabled={isLoadingCarData}
          >
            <SelectTrigger id="brandId" className="bg-white">
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent
              showSearch={true}
              searchPlaceholder="Поиск бренда..."
              onSearchChange={setSearchBrandTerm}
              searchValue={searchBrandTerm}
            >
              {filteredBrands.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                filteredBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="modelId">Модель</Label>
          <Select
            value={formData.modelId}
            onValueChange={(value) => handleInputChange('modelId', value)}
            disabled={!formData.brandId || isLoadingCarData}
          >
            <SelectTrigger id="modelId" className="bg-white">
              <SelectValue placeholder="Выберите модель" />
            </SelectTrigger>
            <SelectContent
              showSearch={true}
              searchPlaceholder="Поиск модели..."
              onSearchChange={setSearchModelTerm}
              searchValue={searchModelTerm}
            >
              {filteredModels.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена ($) *</Label>
          <Input 
            id="price" 
            type="number" 
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            required 
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivery_price">Стоимость доставки ($)</Label>
          <Input 
            id="delivery_price"
            type="number"
            value={formData.delivery_price}
            onChange={(e) => handleInputChange('delivery_price', e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buyerOptId">OPT_ID получателя *</Label>
          <Select
            value={formData.buyerOptId}
            onValueChange={(value: string) => handleInputChange("buyerOptId", value)}
            required
          >
            <SelectTrigger id="buyerOptId" className="bg-white">
              <SelectValue placeholder="Выберите OPT_ID покупателя" />
            </SelectTrigger>
            <SelectContent>
              {sortedBuyerProfiles.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                sortedBuyerProfiles.map((p) => (
                  <SelectItem key={p.opt_id} value={p.opt_id}>
                    {p.opt_id} {p.full_name ? `- ${p.full_name}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellerId">Продавец *</Label>
          <Select
            value={formData.sellerId}
            onValueChange={(value: string) => handleInputChange("sellerId", value)}
            required
          >
            <SelectTrigger id="sellerId" className="bg-white">
              <SelectValue placeholder="Выберите продавца" />
            </SelectTrigger>
            <SelectContent>
              {sortedSellerProfiles.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                sortedSellerProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.opt_id || "Без OPT_ID"} {p.full_name ? `- ${p.full_name}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSeller && (
        <>
          <div className="space-y-2">
            <Label>Имя продавца</Label>
            <Input 
              value={selectedSeller.full_name || 'Неизвестный продавец'} 
              readOnly 
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label>OPT_ID продавца</Label>
            <Input 
              value={selectedSeller.opt_id || ''} 
              readOnly 
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label>Телеграм продавца</Label>
            <Input 
              value={selectedSeller.telegram || ''} 
              readOnly 
              className="bg-gray-100"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Способ доставки</Label>
        <Select
          value={formData.deliveryMethod}
          onValueChange={(value: DeliveryMethod) => handleInputChange('deliveryMethod', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите способ доставки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self_pickup">Самовывоз</SelectItem>
            <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
            <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="place_number">Количество мест для отправки</Label>
        <Input 
          id="place_number" 
          type="number"
          value={formData.place_number}
          onChange={(e) => handleInputChange('place_number', e.target.value)}
          required 
          min="1"
          placeholder="Укажите количество мест"
        />
      </div>

      <div className="space-y-2">
        <Label>Дополнительная информация</Label>
        <Textarea 
          placeholder="Укажите дополнительную информацию по заказу (необязательно)"
          className="resize-none"
          rows={3}
          value={formData.text_order}
          onChange={(e) => handleInputChange('text_order', e.target.value)}
        />
      </div>

      {/* Диалог выбора товаров продавца */}
      <SellerProductsDialog
        open={showProductsDialog}
        onOpenChange={setShowProductsDialog}
        sellerId={selectedSeller?.id || null}
        sellerName={selectedSeller?.full_name || ""}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
};
