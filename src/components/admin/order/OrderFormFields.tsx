
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderFormData, SellerProfile, ProfileShort, DeliveryMethod } from "./types";

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
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Наименование *</Label>
        <Input 
          id="title" 
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
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
            min="0"
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
            min="0"
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
              {buyerProfiles.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                buyerProfiles.map((p) => (
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
              {sellerProfiles.length === 0 ? (
                <SelectItem value="no_data">Нет данных</SelectItem>
              ) : (
                sellerProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || "Без имени"} {p.opt_id ? `(OPT_ID: ${p.opt_id})` : ""}
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
    </div>
  );
};
