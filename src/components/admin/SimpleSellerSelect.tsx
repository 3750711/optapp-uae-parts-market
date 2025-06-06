
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import OptimizedSelect from "@/components/ui/OptimizedSelect";

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

  // Преобразуем продавцов в формат для OptimizedSelect
  const sellerOptions = sellers.map(seller => ({
    value: seller.id,
    label: `${seller.opt_id || "Без OPT_ID"} - ${seller.full_name}`,
    searchText: `${seller.full_name} ${seller.opt_id || ''}`
  }));

  return (
    <FormField
      control={form.control}
      name="sellerId"
      render={({ field }) => {
        const currentValue = field.value || "";
        
        return (
          <FormItem>
            <FormLabel>Продавец *</FormLabel>
            <FormControl>
              <OptimizedSelect
                options={sellerOptions}
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
                placeholder="Выберите продавца..."
                searchPlaceholder="Поиск продавца..."
                disabled={isLoading || sellers.length === 0}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default SimpleSellerSelect;
