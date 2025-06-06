
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";

interface SimpleSellerSelectProps {
  form: UseFormReturn<any>;
  sellers: Array<{id: string, full_name: string, opt_id?: string}>;
  isLoading?: boolean;
}

const SimpleSellerSelect: React.FC<SimpleSellerSelectProps> = ({
  form,
  sellers,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  console.log('🔍 SimpleSellerSelect render:', {
    sellersCount: sellers.length,
    isLoading,
    searchTerm
  });

  // Фильтруем продавцов по поисковому запросу
  const filteredSellers = sellers.filter(seller => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      seller.full_name.toLowerCase().includes(searchLower) ||
      (seller.opt_id && seller.opt_id.toLowerCase().includes(searchLower))
    );
  });

  // Показываем skeleton во время загрузки
  if (isLoading) {
    return (
      <FormField
        control={form.control}
        name="sellerId"
        render={() => (
          <FormItem>
            <FormLabel>Продавец *</FormLabel>
            <FormControl>
              <Skeleton className="h-10 w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Не рендерим селект если нет продавцов
  if (sellers.length === 0) {
    return (
      <FormField
        control={form.control}
        name="sellerId"
        render={() => (
          <FormItem>
            <FormLabel>Продавец *</FormLabel>
            <FormControl>
              <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50 text-gray-500">
                Продавцы не найдены
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name="sellerId"
      render={({ field }) => {
        const currentValue = field.value || "";
        const selectedSeller = sellers.find(seller => seller.id === currentValue);
        
        console.log('💰 SimpleSellerSelect field render:', {
          fieldValue: field.value,
          currentValue,
          selectedSellerExists: !!selectedSeller,
          filteredCount: filteredSellers.length
        });

        return (
          <FormItem>
            <FormLabel>Продавец *</FormLabel>
            <FormControl>
              <Select
                value={currentValue}
                onValueChange={(value) => {
                  console.log('💰 Продавец выбран:', {
                    value,
                    sellerName: sellers.find(s => s.id === value)?.full_name
                  });
                  
                  // Проверяем что выбранный продавец существует в списке
                  if (sellers.some(seller => seller.id === value)) {
                    field.onChange(value);
                  } else {
                    console.error('⚠️ Выбранный продавец не найден в списке:', value);
                  }
                }}
                disabled={isLoading || sellers.length === 0}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Выберите продавца..." />
                </SelectTrigger>
                <SelectContent
                  showSearch={true}
                  searchPlaceholder="Поиск продавца..."
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                >
                  {filteredSellers.length === 0 ? (
                    <SelectItem value="no_results" disabled>
                      {searchTerm ? "Нет результатов" : "Нет данных"}
                    </SelectItem>
                  ) : (
                    filteredSellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.opt_id || "Без OPT_ID"} - {seller.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default SimpleSellerSelect;
