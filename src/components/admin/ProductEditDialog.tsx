
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

// For icons: use only x from allowed lucide-react-icons

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

export const ProductEditDialog = ({ product, trigger, onSuccess, open, setOpen }: ProductEditDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = React.useState(false);
  // Use either the external or internal state for controlling the dialog
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = setOpen || setInternalOpen;

  // State for images/videos that belong to the product
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
  const [deleting, setDeleting] = React.useState<{url: string, type: 'image'|'video'|null}>({url: '', type: null});

  React.useEffect(() => {
    // Update local images/videos state if product changes
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

  // Delete image permanently from Supabase Storage and DB
  const handleImageDelete = async (url: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive"
      });
      return;
    }
    setDeleting({url, type: 'image'});
    try {
      // Remove from order-images bucket, path after "order-images/"
      const path = url.split('/').slice(url.split('/').findIndex(p => p === 'order-images') + 1).join('/');
      // Remove file from storage
      const { error: storageErr } = await supabase.storage.from('order-images').remove([path]);
      if (storageErr) {
        throw storageErr;
      }
      // Remove from product_images table
      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('url', url)
        .eq('product_id', product.id);
      if (dbErr) {
        throw dbErr;
      }
      setImages((prev) => prev.filter((img) => img !== url));
      toast({ title: "Фото удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить фото",
        variant: "destructive"
      });
    } finally {
      setDeleting({url: '', type: null});
    }
  };

  // Delete video from Supabase Storage and DB
  const handleVideoDelete = async (url: string) => {
    setDeleting({url, type: 'video'});
    try {
      // Remove from video bucket, path after "order-videos/" or "product-videos/"
      // Try both for flexibility in bucket naming
      let path = "";
      if (url.includes("product-videos")) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'product-videos') + 1).join('/');
      } else if (url.includes("order-videos")) {
        path = url.split('/').slice(url.split('/').findIndex(p => p === 'order-videos') + 1).join('/');
      } else {
        // fallback: just trim domain part
        path = url.split('/').slice(4).join('/');
      }
      // Remove file from storage (try both in case)
      await supabase.storage.from('product-videos').remove([path]);
      // Remove from DB table
      await supabase.from('product_videos').delete().eq('url', url).eq('product_id', product.id);
      setVideos((prev) => prev.filter((vid) => vid !== url));
      toast({ title: "Видео удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить видео",
        variant: "destructive"
      });
    } finally {
      setDeleting({url: '', type: null});
    }
  };

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
        </DialogHeader>
        {/* IMAGE DELETION */}
        {images.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-1">Фотографии</div>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={img} className="relative group rounded-md overflow-hidden border aspect-square">
                  <img src={img} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Удалить фото"
                    className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
                    onClick={() => handleImageDelete(img)}
                    disabled={deleting.type === "image" && deleting.url === img}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* VIDEO DELETION */}
        {videos.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-1">Видео</div>
            <div className="grid grid-cols-2 gap-2">
              {videos.map((vid, idx) => (
                <div key={vid} className="relative group rounded-md overflow-hidden border aspect-video bg-black">
                  <video src={vid} controls className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Удалить видео"
                    className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
                    onClick={() => handleVideoDelete(vid)}
                    disabled={deleting.type === "video" && deleting.url === vid}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Состояние</FormLabel>
                    <FormControl>
                      <Input placeholder="Новый, Б/У, и т.д." {...field} />
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
                    <FormLabel>Модель</FormLabel>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Местоположение</FormLabel>
                  <FormControl>
                    <Input placeholder="Город, район" {...field} />
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
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Подробное описание товара" className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                Сохранить
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
