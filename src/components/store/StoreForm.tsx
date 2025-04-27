
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { StoreTag } from '@/types/store';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StoreFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    address: string;
    phone?: string | null;
    tags?: StoreTag[] | null;
  };
  onSuccess?: (storeId: string) => void;
}

const storeFormSchema = z.object({
  name: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().optional(),
  address: z.string().min(5, 'Адрес должен быть не менее 5 символов'),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const StoreForm: React.FC<StoreFormProps> = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      phone: initialData?.phone || '',
      tags: initialData?.tags as string[] || [],
    },
  });

  const onSubmit = async (values: StoreFormValues) => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Вы должны быть авторизованы для создания магазина',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let storeId = initialData?.id;
      
      if (!storeId) {
        // Create new store
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .insert({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            seller_id: user.id,
            tags: values.tags as StoreTag[] || [],
          })
          .select()
          .single();
          
        if (storeError) {
          throw storeError;
        }
        
        storeId = storeData.id;
      } else {
        // Update existing store
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            tags: values.tags as StoreTag[] || [],
          })
          .eq('id', storeId);
          
        if (updateError) {
          throw updateError;
        }
      }

      // Handle images
      if (images.length > 0) {
        const storeImages = images.map(url => ({
          store_id: storeId,
          url,
          is_primary: images.indexOf(url) === 0, // First image is primary
        }));
        
        const { error: imagesError } = await supabase
          .from('store_images')
          .insert(storeImages);
          
        if (imagesError) {
          throw imagesError;
        }
      }

      toast({
        title: initialData ? 'Магазин обновлен' : 'Магазин создан',
        description: initialData 
          ? 'Ваш магазин был успешно обновлен' 
          : 'Ваш магазин был успешно создан',
      });

      if (onSuccess && storeId) {
        onSuccess(storeId);
      }
    } catch (error) {
      console.error('Error creating/updating store:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить магазин. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTags: { value: StoreTag; label: string }[] = [
    { value: 'electronics', label: 'Электроника' },
    { value: 'auto_parts', label: 'Авто запчасти' },
    { value: 'accessories', label: 'Аксессуары' },
    { value: 'spare_parts', label: 'Запчасти' },
    { value: 'other', label: 'Другое' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="p-6">
          <div className="space-y-6">
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
              <FormLabel>Категории</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableTags.map((tag) => (
                  <div key={tag.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag.value}`}
                      checked={form.watch('tags')?.includes(tag.value)}
                      onCheckedChange={(checked) => {
                        const currentTags = form.getValues('tags') || [];
                        const newTags = checked 
                          ? [...currentTags, tag.value]
                          : currentTags.filter(t => t !== tag.value);
                        form.setValue('tags', newTags);
                      }}
                    />
                    <Label htmlFor={`tag-${tag.value}`}>{tag.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Фотографии магазина</FormLabel>
              <div className="mb-4">
                <ImageUpload 
                  value={images}
                  onChange={setImages}
                  onRemove={(url) => setImages(images.filter(img => img !== url))}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : initialData ? 'Сохранить изменения' : 'Создать магазин'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StoreForm;
