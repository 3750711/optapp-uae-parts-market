import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

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
  brand: z.string().min(1, { message: "Введите бренд" }),
  model: z.string().optional(), // Make model optional
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
  const queryClient = useQueryClient(); // Get queryClient to invalidate cache
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;

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
  const [primaryImage, setPrimaryImage] = useState<string>(() => {
    if (Array.isArray(product.product_images)) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      return primary ? primary.url : (product.product_images[0]?.url || '');
    }
    return '';
  });

  useEffect(() => {
    setImages(Array.isArray(product.product_images) ? product.product_images.map((img: any) => img.url) : []);
    setVideos(Array.isArray(product.product_videos) ? product.product_videos.map((vid: any) => vid.url) : []);
    
    // Set primary image
    if (Array.isArray(product.product_images)) {
      const primary = product.product_images.find((img: any) => img.is_primary);
      setPrimaryImage(primary ? primary.url : (product.product_images[0]?.url || ''));
    }
  }, [product]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product.title || "",
      price: product.price?.toString() || "",
      description: product.description || "",
      brand: product.brand || "",
      model: product.model || "",  // Allow empty model
      place_number: product.place_number || 1,
      delivery_price: product.delivery_price?.toString() || "0",
    },
  });

  const handlePrimaryImageChange = async (imageUrl: string) => {
    try {
      console.log("Setting primary image in ProductEditDialog:", imageUrl);
      
      // First, reset all images for this product to not primary
      const { error: resetError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', product.id);
      
      if (resetError) throw resetError;
      
      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', product.id)
        .eq('url', imageUrl);
      
      if (error) throw error;
      
      setPrimaryImage(imageUrl);
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      
      toast({
        title: "Успех",
        description: "Основное фото обновлено",
      });
    } catch (error) {
      console.error("Error setting primary image:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить основное фото",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Allow for empty model value
    const modelValue = values.model === "" ? null : values.model;
    
    const { error } = await supabase
      .from('products')
      .update({
        title: values.title,
        price: parseFloat(values.price),
        description: values.description,
        brand: values.brand,
        model: modelValue, // This can now be null
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
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      
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
        className="!w-[600px] !h-[600px] !max-w-[95vw] !max-h-[95vh] p-6 rounded-2xl bg-white flex flex-col justify-between shadow-lg"
        style={{ minWidth: 340, minHeight: 500 }}
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-optapp-dark">Редактировать товар</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="details" className="flex-1">Информация</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Медиафайлы</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input placeholder="Название товара" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цена (AED)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                          <FormLabel>Стоимость доставки (AED)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Бренд</FormLabel>
                          <FormControl>
                            <Input placeholder="Бренд" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Модель (необязательно)</FormLabel>
                          <FormControl>
                            <Input placeholder="Модель" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="place_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество мест</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1" 
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
                        <FormLabel>Описание (необязательно)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Подробное описание товара" 
                            className="min-h-[100px]" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                    >
                      Сохранить
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="media">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Фотографии</h3>
                  <AdminProductImagesManager
                    productId={product.id}
                    images={images}
                    onImagesChange={setImages}
                    primaryImage={primaryImage}
                    onPrimaryImageChange={handlePrimaryImageChange}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Видео</h3>
                  <AdminProductVideosManager
                    productId={product.id}
                    videos={videos}
                    onVideosChange={setVideos}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
