
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimpleSellerSelectProps {
  form: UseFormReturn<any>;
  sellers: Array<{id: string, full_name: string, opt_id?: string}>;
  isLoading?: boolean;
  error?: string | null;
  onRefetch?: () => void;
}

const SimpleSellerSelect: React.FC<SimpleSellerSelectProps> = ({
  form,
  sellers,
  isLoading = false,
  error = null,
  onRefetch
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  console.log('🔍 SimpleSellerSelect render:', {
    sellersCount: sellers.length,
    isLoading,
    hasError: !!error,
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

  // Показываем ошибку с возможностью повторной попытки
  if (error) {
    return (
      <FormField
        control={form.control}
        name="sellerId"
        render={() => (
          <FormItem>
            <FormLabel>Продавец *</FormLabel>
            <FormControl>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Ошибка загрузки продавцов: {error}</span>
                  {onRefetch && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onRefetch}
                      className="ml-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Повторить
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
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
              <div className="h-10 flex items-center justify-between px-3 border rounded-md bg-gray-50 text-gray-500">
                <span>Продавцы не найдены</span>
                {onRefetch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRefetch}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
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
