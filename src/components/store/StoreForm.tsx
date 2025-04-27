
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { StoreWithImages } from '@/types/store';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';

const storeFormSchema = z.object({
  name: z.string().min(2, {
    message: "Название магазина должно содержать не менее 2 символов",
  }).max(50, {
    message: "Название магазина не должно превышать 50 символов",
  }),
  description: z.string().max(500, {
    message: "Описание не должно превышать 500 символов",
  }).optional(),
  address: z.string().min(5, {
    message: "Адрес должен содержать не менее 5 символов",
  }).max(200, {
    message: "Адрес не должен превышать 200 символов",
  }),
  phone: z.string().max(20, {
    message: "Телефон не должен превышать 20 символов",
  }).optional(),
  tags: z.array(z.string()).optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface StoreFormProps {
  store?: StoreWithImages;
  onSuccess: (id: string) => void;
}

const tagOptions = [
  { value: 'electronics', label: 'Электроника' },
  { value: 'auto_parts', label: 'Автозапчасти' },
  { value: 'accessories', label: 'Аксессуары' },
  { value: 'spare_parts', label: 'Запчасти' },
  { value: 'other', label: 'Другое' },
];

const StoreForm = ({ store, onSuccess }: StoreFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(
    store?.store_images?.map(img => img.url) || []
  );
  
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: store?.name || '',
      description: store?.description || '',
      address: store?.address || '',
      phone: store?.phone || '',
      tags: store?.tags || [],
    },
  });
  
  const onSubmit = async (values: StoreFormValues) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let storeId = store?.id;
      
      if (!storeId) {
        // Create new store
        const { data: newStore, error: storeError } = await supabase
          .from('stores')
          .insert({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            tags: values.tags || [],
            seller_id: user.id,
          })
          .select()
          .single();
        
        if (storeError) throw storeError;
        storeId = newStore.id;
      } else {
        // Update existing store
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            tags: values.tags || [],
            updated_at: new Date().toISOString(),
          })
          .eq('id', storeId);
        
        if (updateError) throw updateError;
      }
      
      // Handle image uploads
      if (imageFiles.length > 0) {
        let isFirstImage = !store || store.store_images?.length === 0;
        
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `store-images/${storeId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('store-images')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }
          
          const { data: publicUrl } = supabase.storage
            .from('store-images')
            .getPublicUrl(filePath);
          
          const { error: imageError } = await supabase
            .from('store_images')
            .insert({
              store_id: storeId,
              url: publicUrl.publicUrl,
              is_primary: isFirstImage, // first image is primary
            });
          
          if (imageError) {
            console.error('Error saving image record:', imageError);
          }
          
          isFirstImage = false;
        }
      }
      
      toast({
        title: "Успешно!",
        description: store ? "Магазин обновлен" : "Магазин создан",
      });
      
      onSuccess(storeId);
    } catch (error) {
      console.error('Error saving store:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить магазин",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Preview images
    const newImageUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newImageUrls]);
    
    // Store files for upload
    setImageFiles(prev => [...prev, ...selectedFiles]);
    
    // Reset input
    e.target.value = '';
  };
  
  const removeImage = (index: number) => {
    if (index < imageUrls.length) {
      const newImageUrls = [...imageUrls];
      newImageUrls.splice(index, 1);
      setImageUrls(newImageUrls);
      
      if (index < imageFiles.length) {
        const newImageFiles = [...imageFiles];
        newImageFiles.splice(index, 1);
        setImageFiles(newImageFiles);
      }
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название магазина</FormLabel>
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
                  placeholder="Описание вашего магазина..." 
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
              <FormLabel>Адрес</FormLabel>
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
                <Input placeholder="+7 (XXX) XXX-XX-XX" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категории</FormLabel>
              <Select
                multiple
                value={field.value}
                onValueChange={(value: string[]) => field.onChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категории" />
                </SelectTrigger>
                <SelectContent>
                  {tagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Выберите одну или несколько категорий для вашего магазина
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Фотографии</FormLabel>
          <div className="mt-2 flex items-center justify-center w-full">
            <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Нажмите чтобы загрузить</span> или перетащите файлы
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 2MB)</p>
              </div>
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageChange}
              />
            </label>
          </div>
          
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                  <img 
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {store ? 'Обновить магазин' : 'Создать магазин'}
        </Button>
      </form>
    </Form>
  );
};

export default StoreForm;
