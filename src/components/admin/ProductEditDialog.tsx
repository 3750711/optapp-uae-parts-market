
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MobileOptimizedImageUpload } from '@/components/ui/MobileOptimizedImageUpload';
import { Loader2 } from 'lucide-react';
import { normalizeDecimal } from '@/utils/number';

const editProductSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  price: z.string().min(1, 'Цена обязательна'),
  brand: z.string().min(1, 'Марка обязательна'),
  model: z.string().optional(),
  description: z.string().optional(),
  condition: z.string().min(1, 'Состояние обязательно'),
  status: z.enum(['pending', 'active', 'sold', 'archived']),
  place_number: z.string().min(1, 'Количество мест обязательно'),
  delivery_price: z.string().optional(),
});

type EditProductFormValues = z.infer<typeof editProductSchema>;

interface ProductEditDialogProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>('');

  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      title: '',
      price: '',
      brand: '',
      model: '',
      description: '',
      condition: 'Новый',
      status: 'pending',
      place_number: '1',
      delivery_price: '0',
    },
  });

  // Load product data when dialog opens
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        title: product.title || '',
        price: product.price?.toString() || '',
        brand: product.brand || '',
        model: product.model || '',
        description: product.description || '',
        condition: product.condition || 'Новый',
        status: product.status || 'pending',
        place_number: product.place_number?.toString() || '1',
        delivery_price: product.delivery_price?.toString() || '0',
      });

      // Load existing images
      const existingImages = product.product_images?.map((img: any) => img.url) || [];
      setImageUrls(existingImages);
      
      // Set primary image
      const primaryImg = product.product_images?.find((img: any) => img.is_primary)?.url || existingImages[0] || '';
      setPrimaryImage(primaryImg);
    }
  }, [isOpen, product, form]);

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    // Set primary image if none selected
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (url: string) => {
    const newImageUrls = imageUrls.filter(img => img !== url);
    setImageUrls(newImageUrls);
    
    // Update primary image if deleted
    if (primaryImage === url) {
      setPrimaryImage(newImageUrls[0] || '');
    }
  };

  const onSubmit = async (values: EditProductFormValues) => {
    if (!product?.id) return;

    setIsLoading(true);
    try {
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          title: values.title,
          price: normalizeDecimal(values.price),
          brand: values.brand,
          model: values.model || null,
          description: values.description || null,
          condition: values.condition,
          status: values.status,
          place_number: normalizeDecimal(values.place_number),
          delivery_price: values.delivery_price ? normalizeDecimal(values.delivery_price) : 0,
        })
        .eq('id', product.id);

      if (productError) throw productError;

      // Update images - delete old ones and add new ones
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id);

      // Add current images
      if (imageUrls.length > 0) {
        const imageInserts = imageUrls.map(url => ({
          product_id: product.id,
          url,
          is_primary: url === primaryImage
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      toast({
        title: 'Успех',
        description: 'Товар успешно обновлен',
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить товар',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Марка</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Новый">Новый</SelectItem>
                        <SelectItem value="Б/у">Б/у</SelectItem>
                        <SelectItem value="Восстановленный">Восстановленный</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Ожидает модерации</SelectItem>
                        <SelectItem value="active">Активный</SelectItem>
                        <SelectItem value="sold">Продан</SelectItem>
                        <SelectItem value="archived">Архивный</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="place_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество мест</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Стоимость доставки ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Фотографии товара</h3>
              <MobileOptimizedImageUpload
                onUploadComplete={handleImageUpload}
                maxImages={50}
                existingImages={imageUrls}
                onImageDelete={handleImageDelete}
                onSetPrimaryImage={setPrimaryImage}
                primaryImage={primaryImage}
                productId={product?.id}
                buttonText="Добавить фотографии"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
