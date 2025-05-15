
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { AdminProductImagesManager } from "./AdminProductImagesManager";
import { AdminProductVideosManager } from "./AdminProductVideosManager";
import { BrandModelSelector } from "@/components/product/BrandModelSelector";
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(2, { message: "Название должно содержать не менее 2 символов" }),
  price: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Цена должна быть положительным числом" }
  ),
  description: z.string().optional(),
  brandId: z.string().min(1, { message: "Выберите марку" }),
  modelId: z.string().optional(), // Make model optional
  place_number: z.number().min(1, { message: "Минимальное количество мест - 1" }),
  delivery_price: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Стоимость доставки должна быть неотрицательным числом" }
  ),
});

interface ProductEditDialogProps {
  product: Product;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const ProductEditDialog = ({
  product,
  trigger,
  onSuccess,
  open,
  setOpen,
}: ProductEditDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;
  const [brandId, setBrandId] = React.useState<string>("");
  const [modelId, setModelId] = React.useState<string | undefined>(undefined);
  
  const [images, setImages] = React.useState<string[]>(
    Array.isArray(product.product_images)
      ? product.product_images.map((img: any) => img.url)
      : []
  );
  const [videos, setVideos] = React.useState<string[]>(
    Array.isArray(product.product_videos)
      ? product.product_videos.map((vid: any) => vid.url)
      : []
  );

  // Fetch brand and model IDs on component mount
  React.useEffect(() => {
    const fetchBrandAndModel = async () => {
      if (!product.brand) return;
      
      // Get the brand ID
      const { data: brandData } = await supabase
        .from('car_brands')
        .select('id')
        .eq('name', product.brand)
        .maybeSingle();
      
      if (brandData?.id) {
        setBrandId(brandData.id);
        
        // If there's a model, get the model ID
        if (product.model) {
          const { data: modelData } = await supabase
            .from('car_models')
            .select('id')
            .eq('brand_id', brandData.id)
            .eq('name', product.model)
            .maybeSingle();
          
          if (modelData?.id) {
            setModelId(modelData.id);
          }
        }
      }
    };
    
    fetchBrandAndModel();
  }, [product]);

  React.useEffect(() => {
    setImages(Array.isArray(product.product_images) ? product.product_images.map((img: any) => img.url) : []);
    setVideos(Array.isArray(product.product_videos) ? product.product_videos.map((vid: any) => vid.url) : []);
  }, [product]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product.title || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      brandId: brandId || "",
      modelId: modelId || "",
      place_number: product.place_number || 1,
      delivery_price: product.delivery_price?.toString() || "0",
    },
    mode: "onChange"
  });
  
  // Update form values when brandId or modelId changes
  React.useEffect(() => {
    form.setValue("brandId", brandId);
    form.setValue("modelId", modelId);
  }, [brandId, modelId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Get the brand and model names for database
    let brandName = product.brand;
    let modelName = product.model;
    
    // If brand ID has changed, get the new brand name
    if (values.brandId !== brandId) {
      const { data: brandData } = await supabase
        .from('car_brands')
        .select('name')
        .eq('id', values.brandId)
        .maybeSingle();
      
      if (brandData?.name) {
        brandName = brandData.name;
      }
    }
    
    // If model ID has changed, get the new model name
    if (values.modelId !== modelId) {
      if (values.modelId) {
        const { data: modelData } = await supabase
          .from('car_models')
          .select('name')
          .eq('id', values.modelId)
          .maybeSingle();
        
        modelName = modelData?.name || null;
      } else {
        modelName = null;
      }
    }
    
    const { error } = await supabase
      .from('products')
      .update({
        title: values.title,
        price: parseFloat(values.price),
        description: values.description,
        brand: brandName,
        model: modelName, // This can now be null
        place_number: values.place_number,
        delivery_price: parseFloat(values.delivery_price),
      })
      .eq('id', product.id);

    if (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить товар",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Товар успешно обновлен",
      });
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="!w-[480px] !h-[480px] !max-w-[92vw] !max-h-[92vh] p-4 rounded-2xl bg-white flex flex-col justify-between shadow-lg"
        style={{ minWidth: 340, minHeight: 340 }}
      >
        <DialogHeader className="mb-2 pb-0">
          <DialogTitle className="text-lg font-bold text-optapp-dark mb-1">Редактировать товар</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AdminProductImagesManager
              productId={product.id}
              images={images}
              onImagesChange={setImages}
            />
            <AdminProductVideosManager
              productId={product.id}
              videos={videos}
              onVideosChange={setVideos}
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs mb-0.5">Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Название товара" className="h-8 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs mb-0.5">Цена (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" className="h-8 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Label className="text-xs">Марка и модель</Label>
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem className="space-y-1 mt-0.5">
                    <BrandModelSelector
                      selectedBrandId={field.value}
                      selectedModelId={form.getValues("modelId")}
                      onBrandChange={(brandId) => {
                        field.onChange(brandId);
                        setBrandId(brandId);
                        // Clear model if brand changes
                        if (brandId !== field.value) {
                          form.setValue("modelId", undefined);
                          setModelId(undefined);
                        }
                      }}
                      onModelChange={(modelId) => {
                        form.setValue("modelId", modelId);
                        setModelId(modelId);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modelId"
                render={() => <></>} // Hidden field, managed by the BrandModelSelector
              />
              
              <FormField
                control={form.control}
                name="place_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs mb-0.5">Количество мест</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="1" 
                        className="h-8 text-sm" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                    <FormLabel className="text-xs mb-0.5">Описание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Подробное описание" className="min-h-[60px] max-h-[80px] text-sm" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs mb-0.5">Стоимость доставки (AED)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        className="h-8 text-sm" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3 py-1 text-xs"
                  onClick={() => handleOpenChange(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 px-3 py-1 text-xs"
                  size="sm"
                >
                  Сохранить
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
