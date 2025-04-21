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
import { X } from "lucide-react";
import { AdminProductImagesManager } from "./AdminProductImagesManager";
import { AdminProductVideosManager } from "./AdminProductVideosManager";

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
  model: z.string().min(1, { message: "Введите модель" }),
  condition: z.string().min(1, { message: "Введите состояние" }),
  location: z.string().optional(),
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
      brand: product.brand || "",
      model: product.model || "",
      condition: product.condition || "",
      location: product.location || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from('products')
      .update({
        title: values.title,
        price: parseFloat(values.price),
        description: values.description,
        brand: values.brand,
        model: values.model,
        condition: values.condition,
        location: values.location,
      })
      .eq('id', product.id);

    if (error) {
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
        className="!w-[500px] !h-[530px] !max-w-[92vw] !max-h-[92vh] p-4 rounded-2xl bg-white flex flex-col justify-between shadow-lg"
        style={{ minWidth: 340, minHeight: 420 }}
      >
        <DialogHeader className="mb-2 pb-0">
          <DialogTitle className="text-lg font-bold text-optapp-dark mb-1">Редактировать товар</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
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
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs mb-0.5">Состояние</FormLabel>
                      <FormControl>
                        <Input placeholder="Новый, Б/У, и т.д." className="h-8 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs mb-0.5">Бренд</FormLabel>
                      <FormControl>
                        <Input placeholder="Бренд" className="h-8 text-sm" {...field} />
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
                      <FormLabel className="text-xs mb-0.5">Модель</FormLabel>
                      <FormControl>
                        <Input placeholder="Модель" className="h-8 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs mb-0.5">Местоположение</FormLabel>
                    <FormControl>
                      <Input placeholder="Город, район" className="h-8 text-sm" {...field} />
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
