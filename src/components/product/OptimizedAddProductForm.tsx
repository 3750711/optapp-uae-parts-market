import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import SimpleCarSelector from "@/components/ui/SimpleCarSelector";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать минимум 3 символа.",
  }),
  price: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }, {
    message: "Цена должна быть числом больше 0.",
  }),
  description: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  place_number: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }, {
    message: "Номер места должен быть числом больше 0.",
  }),
  delivery_price: z.string().refine((value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Цена доставки должна быть числом больше или равна 0.",
  }),
});

interface OptimizedAddProductFormProps {
  onSuccess: () => void;
  initialProductData?: {
    title?: string;
    price?: string;
    description?: string;
    brandId?: string;
    modelId?: string;
    place_number?: string;
    delivery_price?: string;
  };
  isMobile: boolean;
}

const OptimizedAddProductForm = ({ onSuccess, initialProductData, isMobile: propIsMobile }) => {
  const { toast } = useToast();
  const { 
    brands,
    brandModels,
    findBrandIdByName,
    findModelIdByName
  } = useCarBrandsAndModels();

  const [searchModelTerm, setSearchModelTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialProductData?.title || "",
      price: initialProductData?.price || "",
      description: initialProductData?.description || "",
      brandId: initialProductData?.brandId || "",
      modelId: initialProductData?.modelId || "",
      place_number: initialProductData?.place_number || "1",
      delivery_price: initialProductData?.delivery_price || "0",
    },
  });

  const { handleSubmit, setValue } = form;

  // Helper function to find model ID by name and brand ID - исправляем количество аргументов
  const findModelIdByNameFixed = useCallback((modelName: string | null, brandId: string) => {
    return findModelIdByName(modelName, brandId);
  }, [findModelIdByName]);

  React.useEffect(() => {
    if (initialProductData?.brandId) {
      setValue('brandId', initialProductData.brandId);
    }
    if (initialProductData?.modelId) {
      setValue('modelId', initialProductData.modelId);
    }
  }, [initialProductData?.brandId, initialProductData?.modelId, setValue]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert price and delivery_price to numbers
      const price = parseFloat(values.price);
      const deliveryPrice = parseFloat(values.delivery_price);

      // Validate that price and deliveryPrice are valid numbers
      if (isNaN(price) || isNaN(deliveryPrice)) {
        toast({
          title: "Ошибка",
          description: "Цена и цена доставки должны быть числами.",
          variant: "destructive",
        });
        return;
      }

      // Create the product object
      const product = {
        title: values.title,
        price: price,
        description: values.description || null,
        brand_id: values.brandId || null,
        model_id: values.modelId || null,
        place_number: parseInt(values.place_number),
        delivery_price: deliveryPrice,
      };

      // Log the product object
      console.log("Product data to be saved:", product);

      // Call the onSuccess callback
      onSuccess();

      // Show a success toast message
      toast({
        title: "Успешно",
        description: "Товар успешно добавлен!",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  // Handle brand and model changes
  const handleBrandChange = (brandId, brandName) => {
    form.setValue('brandId', brandId);
    // Reset model when brand changes
    form.setValue('modelId', '');
    setSearchModelTerm('');
  };

  const handleModelChange = (modelId, modelName) => {
    form.setValue('modelId', modelId);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название</FormLabel>
                <FormControl>
                  <Input placeholder="Название товара" {...field} />
                </FormControl>
                <FormDescription>
                  Введите название товара.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена</FormLabel>
                <FormControl>
                  <Input placeholder="Цена товара" type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Укажите цену товара.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Описание товара"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Добавьте описание товара.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <SimpleCarSelector
            brandId={form.watch("brandId") || ""}
            modelId={form.watch("modelId") || ""}
            onBrandChange={handleBrandChange}
            onModelChange={handleModelChange}
            isMobile={propIsMobile}
            disabled={false}
          />

          <FormField
            control={form.control}
            name="place_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Номер места</FormLabel>
                <FormControl>
                  <Input placeholder="Номер места" type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Укажите номер места.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена доставки</FormLabel>
                <FormControl>
                  <Input placeholder="Цена доставки" type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Укажите цену доставки.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Добавить товар</Button>
      </form>
    </Form>
  );
};

export default OptimizedAddProductForm;
