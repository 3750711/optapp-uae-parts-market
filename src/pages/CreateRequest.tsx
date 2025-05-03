
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from '@/contexts/AuthContext';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import Layout from '@/components/layout/Layout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  title: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }),
  brand: z.string().min(1, { message: "Выберите марку автомобиля" }),
  model: z.string().min(1, { message: "Выберите модель автомобиля" }),
  year: z.string()
    .regex(/^\d{4}$/, { message: "Год должен содержать 4 цифры" })
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear();
    }, { message: "Введите корректный год" }),
  vin: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CreateRequest = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { 
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading: brandsLoading
  } = useCarBrandsAndModels();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      brand: "",
      model: "",
      year: "",
      vin: "",
      description: "",
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!profile) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться для создания запроса",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      const description = `Марка: ${data.brand}\nМодель: ${data.model}\nГод: ${data.year}${data.vin ? `\nVIN: ${data.vin}` : ''}${data.description ? `\n\nДополнительная информация:\n${data.description}` : ''}`;

      const { error } = await supabase
        .from('requests')
        .insert({
          title: data.title,
          description,
          user_id: profile.id,
          user_name: profile.full_name || 'Пользователь',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Запрос создан",
        description: "Ваш запрос успешно отправлен"
      });
      
      navigate('/requests');
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать запрос",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchBrand = form.watch('brand');

  // Update models when brand changes
  React.useEffect(() => {
    if (watchBrand && watchBrand !== selectedBrand) {
      selectBrand(watchBrand);
      form.setValue('model', '');
    }
  }, [watchBrand, selectedBrand, selectBrand, form]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Создать запрос на запчасть</CardTitle>
              <CardDescription>
                Заполните форму, чтобы создать запрос на поиск запчасти
              </CardDescription>
            </CardHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название запчасти *</FormLabel>
                        <FormControl>
                          <Input placeholder="Например: Фара левая, тормозной диск..." {...field} />
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
                        <FormLabel>Марка автомобиля *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={brandsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите марку" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Модель автомобиля *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!selectedBrand || brandsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите модель" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brandModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Год выпуска *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Например: 2018" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VIN номер (если есть)</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите VIN номер автомобиля" {...field} />
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
                        <FormLabel>Дополнительная информация</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Укажите дополнительную информацию о запчасти или автомобиле" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                    disabled={isLoading}
                  >
                    {isLoading ? "Отправка..." : "Отправить запрос"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateRequest;
