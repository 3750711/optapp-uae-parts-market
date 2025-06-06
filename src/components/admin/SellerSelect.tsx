
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import OptimizedSelect from "@/components/ui/OptimizedSelect";

interface SellerSelectProps {
  form: UseFormReturn<any>;
  sellers: Array<{id: string, full_name: string, opt_id?: string}>;
  isLoading?: boolean;
}

const SellerSelect: React.FC<SellerSelectProps> = ({
  form,
  sellers,
  isLoading = false
}) => {
  const sellerOptions = sellers.map(seller => ({
    value: seller.id,
    label: `${seller.full_name}${seller.opt_id ? ` (${seller.opt_id})` : ''}`,
    searchText: `${seller.full_name} ${seller.opt_id || ''}`
  }));

  return (
    <FormField
      control={form.control}
      name="sellerId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Продавец *</FormLabel>
          <FormControl>
            <OptimizedSelect
              options={sellerOptions}
              value={field.value || ""}
              onValueChange={(value) => {
                console.log('Seller selected:', value);
                field.onChange(value);
              }}
              placeholder="Выберите продавца..."
              searchPlaceholder="Поиск продавца..."
              disabled={isLoading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SellerSelect;
