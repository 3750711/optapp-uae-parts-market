import React, { memo } from 'react';
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

interface FastBasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const FastBasicInfoSection = memo<FastBasicInfoSectionProps>(({ form }) => {
  return (
    <div className="fast-basic-info">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">Product Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="BMW X5 F15 Front Bumper"
                className="mobile-input"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="mobile-grid-2">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="mobile-input"
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
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">Delivery Cost ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mobile-input"
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
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">Number of Places</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder="Number of places"
                className="mobile-input"
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
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">Description (optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Product description"
                className="mobile-textarea"
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
});

FastBasicInfoSection.displayName = "FastBasicInfoSection";

export default FastBasicInfoSection;