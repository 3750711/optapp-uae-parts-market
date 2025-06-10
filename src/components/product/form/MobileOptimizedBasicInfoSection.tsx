
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormValues } from "../OptimizedAddProductForm";
import OptimizedSelect from "@/components/ui/OptimizedSelect";

interface MobileOptimizedBasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
  sellers?: Array<{id: string, full_name: string}>;
  searchSellerTerm?: string;
  setSearchSellerTerm?: (term: string) => void;
  showSellerSelection?: boolean;
}

const MobileOptimizedBasicInfoSection: React.FC<MobileOptimizedBasicInfoSectionProps> = ({
  form,
  sellers = [],
  searchSellerTerm = "",
  setSearchSellerTerm,
  showSellerSelection = false
}) => {
  const sellerOptions = React.useMemo(() => {
    return sellers.map(seller => ({
      value: seller.id,
      label: seller.full_name,
      searchText: seller.full_name
    }));
  }, [sellers]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Название товара *</FormLabel>
            <FormControl>
              <Input
                placeholder="Например: Фара передняя левая BMW X5"
                {...field}
                className="text-base"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Price and Place Number */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена * (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  {...field}
                  className="text-base"
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="place_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Количество мест *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...field}
                  className="text-base"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Описание</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Дополнительная информация о товаре..."
                className="resize-none text-base"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Delivery Price */}
      <FormField
        control={form.control}
        name="delivery_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Стоимость доставки (AED)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                className="text-base"
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default MobileOptimizedBasicInfoSection;
