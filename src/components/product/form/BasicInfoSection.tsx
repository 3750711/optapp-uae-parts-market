
import React from 'react';
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
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const BasicInfoSection = React.memo<BasicInfoSectionProps>(({ form }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="For example: BMW X5 F15 Front Bumper"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Cost ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="placeNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Places for Shipping</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder="Number of places"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Description (optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Product description"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

BasicInfoSection.displayName = "BasicInfoSection";

export default BasicInfoSection;
