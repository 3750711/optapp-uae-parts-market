
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
import { Check, Car, FileSparkles, Send } from 'lucide-react';

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
  const [submitted, setSubmitted] = useState(false);
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
      
      setSubmitted(true);
      
      setTimeout(() => {
        toast({
          title: "Запрос создан",
          description: "Ваш запрос успешно отправлен"
        });
        navigate('/requests');
      }, 1500);
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать запрос",
        variant: "destructive",
      });
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
          {submitted ? (
            <div className="flex flex-col items-center justify-center p-10 animate-scale-in">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Запрос успешно отправлен!</h2>
              <p className="text-muted-foreground text-center">Спасибо! Мы свяжемся с вами в ближайшее время.</p>
            </div>
          ) : (
            <Card className="border shadow-lg animate-fade-in overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileSparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Создать запрос на запчасть</CardTitle>
                    <CardDescription>
                      Найдем нужную запчасть для вашего автомобиля
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="animate-fade-in" style={{animationDelay: '100ms'}}>
                            <FormLabel>Название запчасти *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Например: Фара левая, тормозной диск..." 
                                {...field} 
                                className="transition-all focus:scale-[1.01] focus:border-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem className="animate-fade-in" style={{animationDelay: '200ms'}}>
                              <FormLabel>Марка автомобиля *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={brandsLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="transition-all hover:border-primary">
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
                            <FormItem className="animate-fade-in" style={{animationDelay: '300ms'}}>
                              <FormLabel>Модель автомобиля *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={!selectedBrand || brandsLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="transition-all hover:border-primary">
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem className="animate-fade-in" style={{animationDelay: '400ms'}}>
                              <FormLabel>Год выпуска *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Например: 2018" 
                                  {...field} 
                                  className="transition-all focus:scale-[1.01] focus:border-primary"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="vin"
                          render={({ field }) => (
                            <FormItem className="animate-fade-in" style={{animationDelay: '500ms'}}>
                              <FormLabel>VIN номер (если есть)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Введите VIN номер автомобиля" 
                                  {...field} 
                                  className="transition-all focus:scale-[1.01] focus:border-primary"
                                />
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
                          <FormItem className="animate-fade-in" style={{animationDelay: '600ms'}}>
                            <FormLabel>Дополнительная информация</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Укажите дополнительную информацию о запчасти или автомобиле" 
                                className="min-h-[120px] resize-none transition-all focus:scale-[1.01] focus:border-primary"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-hover group relative overflow-hidden animate-fade-in"
                      style={{animationDelay: '700ms'}}
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
                      <Send className="mr-2 h-4 w-4" />
                      {isLoading ? "Отправка..." : "Отправить запрос"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
              
              <div className="p-6 bg-muted/40 border-t animate-fade-in" style={{animationDelay: '800ms'}}>
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-secondary/20 mt-1">
                    <Car className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Почему стоит создать запрос?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Создав запрос, вы получите предложения от проверенных продавцов с лучшими ценами на запчасти для вашего автомобиля.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateRequest;
