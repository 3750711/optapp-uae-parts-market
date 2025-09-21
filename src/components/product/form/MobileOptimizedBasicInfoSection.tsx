
import React from "react";
import { UseFormReturn, FieldPath } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormValues } from "../AddProductForm";
import OptimizedSelect from "@/components/ui/OptimizedSelect";

// Define admin form values interface
interface AdminProductFormValues extends ProductFormValues {
  sellerId: string;
}

// Union type for the form values
type FormValues = ProductFormValues | AdminProductFormValues;

interface MobileOptimizedBasicInfoSectionProps {
  form: UseFormReturn<FormValues>;
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
    <div className="space-y-6">
      {/* Seller Selection - Only for admin */}
      {showSellerSelection && (
        <FormField
          control={form.control}
          name={"sellerId" as FieldPath<FormValues>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Продавец *</FormLabel>
              <FormControl>
                <OptimizedSelect
                  options={sellerOptions}
                  value={String(field.value || "")}
                  onValueChange={field.onChange}
                  placeholder="Выберите продавца..."
                  searchPlaceholder="Поиск продавца..."
                  disabled={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-foreground">Название товара *</FormLabel>
            <FormControl>
              <Input
                placeholder="Например: Фара передняя левая BMW X5"
                {...field}
                className="mobile-input bg-background border-border focus:border-primary focus:ring-primary/20 transition-all duration-200"
                inputMode="text"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Price and Place Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Цена * (AED)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="100"
                  {...field}
                  className="mobile-input bg-background border-border focus:border-primary focus:ring-primary/20 transition-all duration-200"
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
            <FormLabel className="text-sm font-medium text-foreground">Описание</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Дополнительная информация о товаре..."
                className="mobile-input resize-none bg-background border-border focus:border-primary focus:ring-primary/20 transition-all duration-200 min-h-[100px]"
                rows={4}
                {...field}
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
