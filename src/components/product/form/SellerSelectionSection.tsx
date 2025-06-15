
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Seller {
  id: string;
  full_name: string;
  opt_id?: string;
}

interface SellerSelectionSectionProps {
  form: UseFormReturn<any>; // Используем any чтобы поддержать оба типа форм
  sellers: Seller[];
}

const SellerSelectionSection = React.memo<SellerSelectionSectionProps>(({ form, sellers }) => {
  
  const sortedSellers = React.useMemo(() => {
    return [...sellers].sort((a, b) => {
      const optIdA = a.opt_id || '';
      const optIdB = b.opt_id || '';
      return optIdA.localeCompare(optIdB);
    });
  }, [sellers]);

  return (
    <FormField
      control={form.control}
      name="sellerId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Продавец</FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите продавца" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sortedSellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.opt_id ? `${seller.opt_id} - ${seller.full_name}` : seller.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

SellerSelectionSection.displayName = "SellerSelectionSection";

export default SellerSelectionSection;
