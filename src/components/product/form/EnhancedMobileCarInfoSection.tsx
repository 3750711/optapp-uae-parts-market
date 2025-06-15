
import React, { useState, useCallback, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../AddProductForm';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Car, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface EnhancedMobileCarInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
  brands: Brand[];
  brandModels: Model[];
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  watchBrandId: string;
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  initializeBrands: () => void;
  brandsLoaded: boolean;
}

// Популярные бренды для быстрого доступа
const POPULAR_BRANDS = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", 
  "Hyundai", "Kia", "Volkswagen", "BMW", "Mercedes-Benz"
];

const EnhancedMobileCarInfoSection: React.FC<EnhancedMobileCarInfoSectionProps> = ({
  form,
  brands,
  brandModels,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  watchBrandId,
  isLoadingBrands,
  isLoadingModels,
  initializeBrands,
  brandsLoaded
}) => {
  const isMobile = useIsMobile();
  const [brandSheetOpen, setBrandSheetOpen] = useState(false);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);

  // Инициализируем загрузку брендов при первом взаимодействии
  const handleBrandFocus = useCallback(() => {
    if (!brandsLoaded) {
      initializeBrands();
    }
  }, [brandsLoaded, initializeBrands]);

  // Получаем выбранный бренд и модель для отображения
  const selectedBrand = brands.find(brand => brand.id === watchBrandId);
  const selectedModel = brandModels.find(model => model.id === form.watch("modelId"));

  // Популярные бренды из доступных
  const popularBrands = brands.filter(brand => 
    POPULAR_BRANDS.includes(brand.name)
  );

  const handleBrandSelect = (brand: Brand) => {
    form.setValue("brandId", brand.id);
    form.setValue("modelId", ""); // Сбрасываем модель при смене бренда
    setBrandSheetOpen(false);
    setSearchBrandTerm("");
  };

  const handleModelSelect = (model: Model) => {
    form.setValue("modelId", model.id);
    setModelSheetOpen(false);
    setSearchModelTerm("");
  };

  if (!isMobile) {
    // Для десктопа используем стандартную версию
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Марка автомобиля</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Поиск бренда..."
                    value={searchBrandTerm}
                    onChange={(e) => setSearchBrandTerm(e.target.value)}
                    onFocus={handleBrandFocus}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="modelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Модель (необязательно)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Поиск модели..."
                    value={searchModelTerm}
                    onChange={(e) => setSearchModelTerm(e.target.value)}
                    disabled={!watchBrandId}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Выбор бренда - мобильная версия */}
      <FormField
        control={form.control}
        name="brandId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Марка автомобиля
            </FormLabel>
            <FormControl>
              <Sheet open={brandSheetOpen} onOpenChange={setBrandSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between text-left font-normal"
                    onClick={handleBrandFocus}
                  >
                    <div className="flex items-center">
                      <Car className="mr-2 h-4 w-4" />
                      {selectedBrand ? selectedBrand.name : "Выберите марку"}
                    </div>
                    {isLoadingBrands ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh]">
                  <SheetHeader>
                    <SheetTitle>Выберите марку автомобиля</SheetTitle>
                    <SheetDescription>
                      Поиск среди {brands.length} доступных марок
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-4 space-y-4">
                    {/* Поиск */}
                    <div className="relative">
                      <Input
                        placeholder="Поиск марки..."
                        value={searchBrandTerm}
                        onChange={(e) => setSearchBrandTerm(e.target.value)}
                        className="h-12"
                      />
                      <Search className="absolute right-3 top-4 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Популярные бренды */}
                    {!searchBrandTerm && popularBrands.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-600">
                          Популярные марки
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {popularBrands.map((brand) => (
                            <Badge
                              key={brand.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => handleBrandSelect(brand)}
                            >
                              {brand.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Список брендов */}
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1">
                        {isLoadingBrands ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Загрузка брендов...</span>
                          </div>
                        ) : brands.length > 0 ? (
                          brands.map((brand) => (
                            <Button
                              key={brand.id}
                              variant={selectedBrand?.id === brand.id ? "default" : "ghost"}
                              className="w-full justify-start h-12"
                              onClick={() => handleBrandSelect(brand)}
                            >
                              {brand.name}
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {searchBrandTerm ? "Марки не найдены" : "Марки не загружены"}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Выбор модели - мобильная версия */}
      <FormField
        control={form.control}
        name="modelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Модель (необязательно)
            </FormLabel>
            <FormControl>
              <Sheet open={modelSheetOpen} onOpenChange={setModelSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between text-left font-normal"
                    disabled={!watchBrandId}
                  >
                    <div className="flex items-center">
                      <Car className="mr-2 h-4 w-4" />
                      {selectedModel ? selectedModel.name : 
                       watchBrandId ? "Выберите модель" : "Сначала выберите марку"}
                    </div>
                    {isLoadingModels ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh]">
                  <SheetHeader>
                    <SheetTitle>Выберите модель</SheetTitle>
                    <SheetDescription>
                      {selectedBrand ? 
                        `Модели для ${selectedBrand.name}` : 
                        "Выберите модель автомобиля"
                      }
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-4 space-y-4">
                    {/* Поиск */}
                    <div className="relative">
                      <Input
                        placeholder="Поиск модели..."
                        value={searchModelTerm}
                        onChange={(e) => setSearchModelTerm(e.target.value)}
                        className="h-12"
                      />
                      <Search className="absolute right-3 top-4 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Список моделей */}
                    <ScrollArea className="h-[450px]">
                      <div className="space-y-1">
                        {isLoadingModels ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Загрузка моделей...</span>
                          </div>
                        ) : brandModels.length > 0 ? (
                          brandModels.map((model) => (
                            <Button
                              key={model.id}
                              variant={selectedModel?.id === model.id ? "default" : "ghost"}
                              className="w-full justify-start h-12"
                              onClick={() => handleModelSelect(model)}
                            >
                              {model.name}
                            </Button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {searchModelTerm ? "Модели не найдены" : 
                             watchBrandId ? "Модели не загружены" : "Сначала выберите марку"}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnhancedMobileCarInfoSection;
