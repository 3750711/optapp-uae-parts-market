
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { StoreTag } from "@/types/store";
import { MapPin } from "lucide-react";
import StoreLocationPicker from "./StoreLocationPicker";

const storeFormSchema = z.object({
  name: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().optional(),
  address: z.string().min(5, 'Адрес должен быть не менее 5 символов'),
  phone: z.string().optional(),
  location: z.string().min(2, { message: "Укажите местоположение" }),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface StoreEditFormProps {
  sellerId: string;
  onSuccess?: () => void;
}

const StoreEditForm: React.FC<StoreEditFormProps> = ({ sellerId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState("");

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      location: '25.276987, 55.296249', // Dubai coordinates as default
    },
  });

  useEffect(() => {
    async function fetchStoreData() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`*, store_images(url)`)
          .eq('seller_id', sellerId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setStoreData(data);
          setStoreId(data.id);
          
          form.reset({
            name: data.name,
            description: data.description || '',
            address: data.address,
            phone: data.phone || '',
            location: data.location || '25.276987, 55.296249', // Default to Dubai coordinates if not set
          });
          
          // Extract images from store_images
          if (data.store_images && data.store_images.length > 0) {
            const imageUrls = data.store_images.map((img: any) => img.url);
            setImages(imageUrls);
          }
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      }
    }

    if (sellerId) {
      fetchStoreData();
    }
  }, [sellerId]);

  const onSubmit = async (values: StoreFormValues) => {
    setIsLoading(true);
    
    try {
      if (storeId) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            location: values.location,
          })
          .eq('id', storeId);
          
        if (error) throw error;
        
        // Handle existing images if needed
        if (images.length > 0) {
          // First delete all existing images
          const { error: deleteError } = await supabase
            .from('store_images')
            .delete()
            .eq('store_id', storeId);
            
          if (deleteError) throw deleteError;
          
          // Then add the current images
          const storeImages = images.map(url => ({
            store_id: storeId,
            url,
            is_primary: images.indexOf(url) === 0,
          }));
          
          if (storeImages.length > 0) {
            const { error: imagesError } = await supabase
              .from('store_images')
              .insert(storeImages);
              
            if (imagesError) throw imagesError;
          }
        }

        toast({
          title: "Магазин обновлен",
          description: "Данные магазина успешно обновлены",
        });
        
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast({
        title: "Ошибка обновления",
        description: error.message || "Произошла ошибка при обновлении данных магазина",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!storeData && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Информация о магазине</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            У вас еще нет магазина. Заполните поле "Название компании" в профиле, чтобы создать магазин автоматически.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редактирование магазина</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название магазина *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название магазина" {...field} />
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
                    <Textarea 
                      placeholder="Введите описание магазина" 
                      className="min-h-[120px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Местоположение *</FormLabel>
                  <FormControl>
                    <StoreLocationPicker 
                      initialLocation={field.value} 
                      onLocationChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Выберите местоположение вашего магазина, нажав на нужное место на карте
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите адрес магазина" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите телефон магазина" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Фотографии магазина</FormLabel>
              <p className="text-sm text-muted-foreground mb-2">
                Добавьте фотографии вашего магазина, чтобы покупатели могли лучше узнать о нем
              </p>
              <ImageUpload 
                images={images}
                onUpload={(uploadedUrls) => setImages([...images, ...uploadedUrls])}
                onDelete={(url) => setImages(images.filter(img => img !== url))}
                maxImages={10}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StoreEditForm;
