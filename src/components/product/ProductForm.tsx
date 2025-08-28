
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeDecimal } from "@/utils/number";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ProductFormProps {
  formData: {
    title: string;
    price: number;
    description: string;
    brand: string;
    model: string;
    place_number: number;
    delivery_price: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    price: number;
    description: string;
    brand: string;
    model: string;
    place_number: number;
    delivery_price: number;
  }>>;
  brands: Array<{ id: string; name: string }>;
  brandModels: Array<{ id: string; name: string }>;
  selectedBrand: string | null;
  handleBrandChange: (brandId: string) => void;
  handleModelChange: (modelId: string) => void;
  selectedModelId: string | null;
  loadingBrands: boolean;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isCreator?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  brands,
  brandModels,
  selectedBrand,
  handleBrandChange,
  handleModelChange,
  selectedModelId,
  loadingBrands,
  isLoading,
  onSubmit,
  onCancel,
  isCreator = false,
}) => {
  const isMobile = useIsMobile();

  return (
    <form
      onSubmit={onSubmit}
      className={`mobile-form flex flex-col ${isMobile ? "gap-2 sm:gap-3 pb-24" : "gap-2 sm:gap-3"} overscroll-contain`}
    >
      <label htmlFor="title" className="text-xs sm:text-sm font-medium">Название товара</label>
      <Input
        id="title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Название товара"
        className="text-base font-bold h-8 sm:h-8"
        disabled={!isCreator}
      />

      <label htmlFor="price" className="text-xs sm:text-sm font-medium">Цена</label>
      <Input
        id="price"
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: normalizeDecimal(e.target.value) })}
        placeholder="Цена"
        className="h-8 sm:h-8"
        disabled={!isCreator}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="brand" className="text-xs sm:text-sm font-medium">Марка</label>
          <Select
            disabled={!isCreator || loadingBrands}
            value={selectedBrand || ""}
            onValueChange={handleBrandChange}
          >
            <SelectTrigger id="brand" className="h-8 sm:h-8">
              <SelectValue placeholder="Выберите марку" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="model" className="text-xs sm:text-sm font-medium">Модель (необязательно)</label>
          <Select
            disabled={!isCreator || !selectedBrand || loadingBrands}
            value={selectedModelId || ""}
            onValueChange={handleModelChange}
          >
            <SelectTrigger id="model" className="h-8 sm:h-8">
              <SelectValue placeholder="Выберите модель" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {brandModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <label htmlFor="place_number" className="text-xs sm:text-sm font-medium">Количество мест для отправки</label>
      <Input
        id="place_number"
        type="number"
        min="1"
        value={formData.place_number}
        onChange={(e) => setFormData({ ...formData, place_number: Math.max(1, Math.round(normalizeDecimal(e.target.value))) })}
        placeholder="Количество мест для отправки"
        className="h-8 sm:h-8"
        disabled={!isCreator}
      />

      <label htmlFor="description" className="text-xs sm:text-sm font-medium">Описание товара</label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Описание товара"
        className="min-h-[36px] max-h-[80px] text-xs sm:text-sm"
        rows={2}
        disabled={!isCreator}
      />

      <label htmlFor="delivery_price" className="text-xs sm:text-sm font-medium">Стоимость доставки</label>
      <Input
        id="delivery_price"
        type="number"
        value={formData.delivery_price}
        onChange={(e) => setFormData({ 
          ...formData, 
          delivery_price: normalizeDecimal(e.target.value)
        })}
        placeholder="Стоимость доставки"
        className="h-8 sm:h-8"
        disabled={!isCreator}
      />

      {isMobile ? (
        <div className="sticky-footer fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-sm border-t flex justify-between p-3 gap-2 z-50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="h-10 flex-1 text-sm mobile-touch-target"
          >
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button
            type="submit"
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 h-10 flex-1 text-sm mobile-touch-target"
            disabled={isLoading || !isCreator}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            <X className="h-4 w-4 mr-1" />
            Отмена
          </Button>
          <Button
            type="submit"
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 h-8 px-3 text-xs"
            disabled={isLoading || !isCreator}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
